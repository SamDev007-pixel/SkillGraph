<?php
session_start();

$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/db.php';
$db = getDb();

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$data = array_merge($_GET, $_POST, $input);
$action = $data['action'] ?? '';

function send($success, $message = '', $data = [], $code = 200) {
    http_response_code($code);
    echo json_encode(['success' => $success, 'message' => $message, 'data' => $data]);
    exit;
}

function getUserId() {
    $uid = $_SESSION['user_id'] ?? null;
    if (!$uid) {
        send(false, 'Unauthorized. Please sign in.', [], 401);
    }
    return (int)$uid;
}

function checkOwner($db, $table, $id, $userId) {
    $stmt = $db->prepare("SELECT user_id FROM $table WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) {
        send(false, 'Record not found.', [], 404);
    }
    if (empty($row['user_id']) || (int)$row['user_id'] !== $userId) {
        send(false, 'Access denied. Starter content cannot be modified.', [], 403);
    }
}

function csrf() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(16));
    }
    return $_SESSION['csrf_token'];
}

function getStats($db, $userId) {
    $totalTasks = (int)$db->query("SELECT COUNT(*) FROM tasks WHERE user_id IS NULL OR user_id = $userId")->fetchColumn();
    $stmt = $db->prepare("SELECT COUNT(DISTINCT task_id) FROM user_task_progress WHERE user_id = ? AND is_completed = 1");
    $stmt->execute([$userId]);
    $completedTasks = (int)$stmt->fetchColumn();
    $taskPct = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 1) : 0;

    $stmt = $db->prepare("SELECT * FROM practice_problems WHERE user_id = ?");
    $stmt->execute([$userId]);
    $problems = $stmt->fetchAll();
    $pTotal = count($problems);
    $pSolved = 0; $pAttempted = 0; $pNotStarted = 0;
    $diff = [
        'easy'   => ['total' => 0, 'solved' => 0],
        'medium' => ['total' => 0, 'solved' => 0],
        'hard'   => ['total' => 0, 'solved' => 0]
    ];
    foreach ($problems as $p) {
        $d = strtolower($p['difficulty'] ?? 'easy');
        if (!isset($diff[$d])) $d = 'easy';
        $diff[$d]['total']++;
        if ($p['status'] === 'Solved') {
            $pSolved++;
            $diff[$d]['solved']++;
        } elseif ($p['status'] === 'Attempted') {
            $pAttempted++;
        } else {
            $pNotStarted++;
        }
    }
    $pSolvedPct = $pTotal > 0 ? round(($pSolved / $pTotal) * 100, 1) : 0;

    $totalCards = (int)$db->query("SELECT COUNT(*) FROM flashcards WHERE user_id IS NULL OR user_id = $userId")->fetchColumn();
    $stmt = $db->prepare("SELECT COUNT(DISTINCT flashcard_id) FROM user_flashcard_reviews WHERE user_id = ? AND is_reviewed = 1");
    $stmt->execute([$userId]);
    $revCards = (int)$stmt->fetchColumn();
    $cardPct = $totalCards > 0 ? round(($revCards / $totalCards) * 100, 1) : 0;

    $stmt = $db->prepare("SELECT * FROM mistake_notes WHERE user_id = ?");
    $stmt->execute([$userId]);
    $mistakes = $stmt->fetchAll();
    $mTotal = count($mistakes);
    $mRevised = 0;
    foreach ($mistakes as $m) {
        if (!empty($m['is_revised'])) $mRevised++;
    }
    $mPending = $mTotal - $mRevised;
    $mPct = $mTotal > 0 ? round(($mRevised / $mTotal) * 100, 1) : 0;

    return [
        'tasks' => [
            'total' => $totalTasks,
            'completed' => $completedTasks,
            'remaining' => max(0, $totalTasks - $completedTasks),
            'percentage' => $taskPct
        ],
        'practice' => [
            'total' => $pTotal,
            'solved' => $pSolved,
            'attempted' => $pAttempted,
            'not_started' => $pNotStarted,
            'solved_percent' => $pSolvedPct,
            'difficulty' => $diff
        ],
        'flashcards' => [
            'total' => $totalCards,
            'reviewed' => $revCards,
            'remaining' => max(0, $totalCards - $revCards),
            'percentage' => $cardPct
        ],
        'mistakes' => [
            'total' => $mTotal,
            'revised' => $mRevised,
            'pending' => $mPending,
            'percentage' => $mPct
        ],
        'completed_tasks' => $completedTasks,
        'solved_problems' => $pSolved,
        'reviewed_flashcards' => $revCards,
        'total_mistakes' => $mTotal
    ];
}

switch ($action) {
    case 'register':
        $name = trim($data['name'] ?? '');
        $email = trim(strtolower($data['email'] ?? ''));
        $password = $data['password'] ?? '';
        if (!$name || !$email || !$password) send(false, 'All fields are required.', [], 422);

        $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) send(false, 'Email already registered.', [], 409);

        $hash = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $db->prepare("INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, NOW())");
        $stmt->execute([$name, $email, $hash]);
        $uid = (int)$db->lastInsertId();

        $_SESSION['user_id'] = $uid;
        $_SESSION['user_name'] = $name;
        $_SESSION['user_email'] = $email;

        send(true, 'Registration successful.', [
            'user' => ['id' => $uid, 'name' => $name, 'email' => $email],
            'csrf_token' => csrf()
        ], 201);
        break;

    case 'login':
        $email = trim(strtolower($data['email'] ?? ''));
        $password = $data['password'] ?? '';
        if (!$email || !$password) send(false, 'Email and password required.', [], 422);

        $stmt = $db->prepare("SELECT id, name, email, password_hash FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        if (!$user || !password_verify($password, $user['password_hash'])) {
            send(false, 'Invalid credentials.', [], 401);
        }

        $_SESSION['user_id'] = (int)$user['id'];
        $_SESSION['user_name'] = $user['name'];
        $_SESSION['user_email'] = $user['email'];

        send(true, 'Login successful.', [
            'user' => ['id' => (int)$user['id'], 'name' => $user['name'], 'email' => $user['email']],
            'csrf_token' => csrf()
        ]);
        break;

    case 'logout':
        $_SESSION = [];
        session_destroy();
        send(true, 'Logged out.');
        break;

    case 'me':
        $uid = $_SESSION['user_id'] ?? null;
        if (!$uid) send(false, 'Not authenticated', ['authenticated' => false], 401);
        $stmt = $db->prepare("SELECT id, name, email, created_at FROM users WHERE id = ?");
        $stmt->execute([$uid]);
        $user = $stmt->fetch();
        if (!$user) {
            session_destroy();
            send(false, 'User not found', ['authenticated' => false], 401);
        }
        send(true, 'Authenticated', [
            'authenticated' => true,
            'user' => ['id' => (int)$user['id'], 'name' => $user['name'], 'email' => $user['email'], 'created_at' => $user['created_at']],
            'csrf_token' => csrf()
        ]);
        break;

    case 'dashboard':
        $uid = getUserId();
        $stats = getStats($db, $uid);

        $stmt = $db->prepare("SELECT p.*, t.title AS topic_title FROM practice_problems p LEFT JOIN topics t ON t.id = p.topic_id WHERE p.user_id = ? ORDER BY p.id DESC LIMIT 4");
        $stmt->execute([$uid]);
        $recentPractice = $stmt->fetchAll();

        $stmt = $db->prepare("SELECT m.*, t.title AS topic_title FROM mistake_notes m LEFT JOIN topics t ON t.id = m.topic_id WHERE m.user_id = ? ORDER BY m.id DESC LIMIT 4");
        $stmt->execute([$uid]);
        $recentMistakes = $stmt->fetchAll();

        $tracks = $db->query("SELECT id, title FROM tracks ORDER BY position ASC, id ASC LIMIT 4")->fetchAll();
        $tracksOverview = [];
        foreach ($tracks as $tr) {
            $trId = (int)$tr['id'];
            $stmt = $db->prepare("SELECT t.id FROM tasks t JOIN topics top ON top.id = t.topic_id WHERE top.track_id = ? AND (t.user_id IS NULL OR t.user_id = ?)");
            $stmt->execute([$trId, $uid]);
            $taskIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
            $total = count($taskIds);
            $comp = 0;
            if ($total > 0) {
                $inList = implode(',', array_map('intval', $taskIds));
                $comp = (int)$db->query("SELECT COUNT(DISTINCT task_id) FROM user_task_progress WHERE user_id = $uid AND is_completed = 1 AND task_id IN ($inList)")->fetchColumn();
            }
            $pct = $total > 0 ? round(($comp / $total) * 100, 1) : 0;
            $tracksOverview[] = [
                'id' => $trId,
                'title' => $tr['title'],
                'total_tasks' => $total,
                'completed_tasks' => $comp,
                'percentage' => $pct
            ];
        }

        send(true, 'Dashboard loaded', [
            'user' => ['id' => $uid, 'name' => $_SESSION['user_name'] ?? '', 'email' => $_SESSION['user_email'] ?? ''],
            'stats' => $stats,
            'tracks' => $tracksOverview,
            'recent_practice' => $recentPractice,
            'recent_mistakes' => $recentMistakes
        ]);
        break;

    case 'tracks':
        $uid = getUserId();
        $allTracks = $db->query("SELECT * FROM tracks ORDER BY position ASC, id ASC")->fetchAll();

        $stmt = $db->prepare("SELECT task_id FROM user_task_progress WHERE user_id = ? AND is_completed = 1");
        $stmt->execute([$uid]);
        $doneMap = array_fill_keys($stmt->fetchAll(PDO::FETCH_COLUMN), true);

        $result = [];
        foreach ($allTracks as $tr) {
            $trId = (int)$tr['id'];
            $stmt = $db->prepare("SELECT * FROM topics WHERE track_id = ? AND (user_id IS NULL OR user_id = ?) ORDER BY position ASC, id ASC");
            $stmt->execute([$trId, $uid]);
            $topics = $stmt->fetchAll();

            $trackTotal = 0;
            $trackComp = 0;
            $topicsList = [];

            foreach ($topics as $top) {
                $topId = (int)$top['id'];
                $stmt = $db->prepare("SELECT * FROM tasks WHERE topic_id = ? AND (user_id IS NULL OR user_id = ?) ORDER BY position ASC, id ASC");
                $stmt->execute([$topId, $uid]);
                $tasks = $stmt->fetchAll();

                $topTotal = count($tasks);
                $topComp = 0;
                $tasksList = [];

                foreach ($tasks as $tsk) {
                    $tId = (int)$tsk['id'];
                    $isDone = isset($doneMap[$tId]);
                    if ($isDone) $topComp++;
                    $tasksList[] = [
                        'id' => $tId,
                        'topic_id' => $topId,
                        'title' => $tsk['title'],
                        'is_completed' => $isDone,
                        'is_starter' => empty($tsk['user_id'])
                    ];
                }

                $trackTotal += $topTotal;
                $trackComp += $topComp;
                $topPct = $topTotal > 0 ? round(($topComp / $topTotal) * 100, 1) : 0;

                $topicsList[] = [
                    'id' => $topId,
                    'track_id' => $trId,
                    'title' => $top['title'],
                    'description' => $top['description'] ?? '',
                    'is_starter' => empty($top['user_id']),
                    'total_tasks' => $topTotal,
                    'completed_tasks' => $topComp,
                    'percentage' => $topPct,
                    'tasks' => $tasksList
                ];
            }

            $trackPct = $trackTotal > 0 ? round(($trackComp / $trackTotal) * 100, 1) : 0;
            $result[] = [
                'id' => $trId,
                'title' => $tr['title'],
                'description' => $tr['description'] ?? '',
                'total_tasks' => $trackTotal,
                'completed_tasks' => $trackComp,
                'percentage' => $trackPct,
                'topics' => $topicsList
            ];
        }

        send(true, 'Tracks retrieved', ['tracks' => $result]);
        break;

    case 'toggle_task':
        $uid = getUserId();
        $taskId = (int)($data['task_id'] ?? 0);
        $done = !empty($data['is_completed']) ? 1 : 0;

        $stmt = $db->prepare("SELECT id FROM tasks WHERE id = ? AND (user_id IS NULL OR user_id = ?)");
        $stmt->execute([$taskId, $uid]);
        if (!$stmt->fetch()) send(false, 'Task not found.', [], 404);

        $stmt = $db->prepare("INSERT INTO user_task_progress (user_id, task_id, is_completed, completed_at)
                              VALUES (?, ?, ?, NOW())
                              ON DUPLICATE KEY UPDATE is_completed = VALUES(is_completed), completed_at = VALUES(completed_at)");
        $stmt->execute([$uid, $taskId, $done]);

        send(true, 'Task updated', ['task_id' => $taskId, 'is_completed' => (bool)$done]);
        break;

    case 'add_topic':
        $uid = getUserId();
        $trackId = (int)($data['track_id'] ?? 0);
        $title = trim($data['title'] ?? '');
        $desc = trim($data['description'] ?? '');
        if (!$trackId || !$title) send(false, 'Track and title are required.', [], 422);

        $stmt = $db->prepare("INSERT INTO topics (track_id, user_id, title, description, position) VALUES (?, ?, ?, ?, 99)");
        $stmt->execute([$trackId, $uid, $title, $desc]);
        send(true, 'Topic added', ['topic_id' => (int)$db->lastInsertId()], 201);
        break;

    case 'edit_topic':
        $uid = getUserId();
        $id = (int)($data['id'] ?? 0);
        $title = trim($data['title'] ?? '');
        $desc = trim($data['description'] ?? '');
        checkOwner($db, 'topics', $id, $uid);

        $stmt = $db->prepare("UPDATE topics SET title = ?, description = ? WHERE id = ?");
        $stmt->execute([$title, $desc, $id]);
        send(true, 'Topic updated');
        break;

    case 'delete_topic':
        $uid = getUserId();
        $id = (int)($data['id'] ?? 0);
        checkOwner($db, 'topics', $id, $uid);

        $db->prepare("DELETE FROM tasks WHERE topic_id = ?")->execute([$id]);
        $db->prepare("DELETE FROM topics WHERE id = ?")->execute([$id]);
        send(true, 'Topic deleted');
        break;

    case 'add_task':
        $uid = getUserId();
        $topicId = (int)($data['topic_id'] ?? 0);
        $title = trim($data['title'] ?? '');
        if (!$topicId || !$title) send(false, 'Topic and title are required.', [], 422);

        $stmt = $db->prepare("INSERT INTO tasks (topic_id, user_id, title, position) VALUES (?, ?, ?, 99)");
        $stmt->execute([$topicId, $uid, $title]);
        send(true, 'Task added', ['task_id' => (int)$db->lastInsertId()], 201);
        break;

    case 'edit_task':
        $uid = getUserId();
        $id = (int)($data['id'] ?? 0);
        $title = trim($data['title'] ?? '');
        checkOwner($db, 'tasks', $id, $uid);

        $stmt = $db->prepare("UPDATE tasks SET title = ? WHERE id = ?");
        $stmt->execute([$title, $id]);
        send(true, 'Task updated');
        break;

    case 'delete_task':
        $uid = getUserId();
        $id = (int)($data['id'] ?? 0);
        checkOwner($db, 'tasks', $id, $uid);

        $db->prepare("DELETE FROM user_task_progress WHERE task_id = ?")->execute([$id]);
        $db->prepare("DELETE FROM tasks WHERE id = ?")->execute([$id]);
        send(true, 'Task deleted');
        break;

    case 'flashcards':
        $uid = getUserId();
        $cat = trim($data['category'] ?? '');
        $status = trim($data['status'] ?? 'all');

        $sql = "SELECT f.*, COALESCE(r.is_reviewed, 0) AS is_reviewed
                FROM flashcards f
                LEFT JOIN user_flashcard_reviews r ON r.flashcard_id = f.id AND r.user_id = ?
                WHERE (f.user_id IS NULL OR f.user_id = ?)";
        $params = [$uid, $uid];

        if ($cat && $cat !== 'all') {
            $sql .= " AND f.category = ?";
            $params[] = $cat;
        }
        if ($status === 'reviewed') {
            $sql .= " AND r.is_reviewed = 1";
        } elseif ($status === 'not_reviewed') {
            $sql .= " AND (r.is_reviewed IS NULL OR r.is_reviewed = 0)";
        }
        $sql .= " ORDER BY f.id ASC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $list = [];
        foreach ($rows as $r) {
            $list[] = [
                'id' => (int)$r['id'],
                'category' => $r['category'],
                'question' => $r['question'],
                'answer' => $r['answer'],
                'is_starter' => empty($r['user_id']),
                'is_reviewed' => (bool)$r['is_reviewed']
            ];
        }

        $cats = $db->query("SELECT DISTINCT category FROM flashcards ORDER BY category ASC")->fetchAll(PDO::FETCH_COLUMN);
        $stats = getStats($db, $uid);

        send(true, 'Flashcards retrieved', [
            'flashcards' => $list,
            'categories' => $cats,
            'summary' => $stats['flashcards'],
            'stats' => $stats['flashcards']
        ]);
        break;

    case 'toggle_flashcard_review':
        $uid = getUserId();
        $cardId = (int)($data['flashcard_id'] ?? 0);
        $reviewed = !empty($data['is_reviewed']) ? 1 : 0;

        $stmt = $db->prepare("INSERT INTO user_flashcard_reviews (user_id, flashcard_id, is_reviewed, reviewed_at)
                              VALUES (?, ?, ?, NOW())
                              ON DUPLICATE KEY UPDATE is_reviewed = VALUES(is_reviewed), reviewed_at = VALUES(reviewed_at)");
        $stmt->execute([$uid, $cardId, $reviewed]);
        send(true, 'Flashcard updated', ['flashcard_id' => $cardId, 'is_reviewed' => (bool)$reviewed]);
        break;

    case 'add_flashcard':
        $uid = getUserId();
        $cat = trim($data['category'] ?? 'General');
        $q = trim($data['question'] ?? '');
        $a = trim($data['answer'] ?? '');
        if (!$q || !$a) send(false, 'Question and answer required.', [], 422);

        $stmt = $db->prepare("INSERT INTO flashcards (user_id, category, question, answer) VALUES (?, ?, ?, ?)");
        $stmt->execute([$uid, $cat, $q, $a]);
        send(true, 'Flashcard added', ['flashcard_id' => (int)$db->lastInsertId()], 201);
        break;

    case 'edit_flashcard':
        $uid = getUserId();
        $id = (int)($data['id'] ?? 0);
        $cat = trim($data['category'] ?? 'General');
        $q = trim($data['question'] ?? '');
        $a = trim($data['answer'] ?? '');
        checkOwner($db, 'flashcards', $id, $uid);

        $stmt = $db->prepare("UPDATE flashcards SET category = ?, question = ?, answer = ? WHERE id = ?");
        $stmt->execute([$cat, $q, $a, $id]);
        send(true, 'Flashcard updated');
        break;

    case 'delete_flashcard':
        $uid = getUserId();
        $id = (int)($data['id'] ?? 0);
        checkOwner($db, 'flashcards', $id, $uid);

        $db->prepare("DELETE FROM user_flashcard_reviews WHERE flashcard_id = ?")->execute([$id]);
        $db->prepare("DELETE FROM flashcards WHERE id = ?")->execute([$id]);
        send(true, 'Flashcard deleted');
        break;

    case 'practice_problems':
        $uid = getUserId();
        $platform = trim($data['platform'] ?? 'All');
        $difficulty = trim($data['difficulty'] ?? 'All');
        $status = trim($data['status'] ?? 'All');
        $search = trim($data['search'] ?? '');

        $sql = "SELECT p.*, t.title AS topic_title FROM practice_problems p
                LEFT JOIN topics t ON t.id = p.topic_id
                WHERE p.user_id = ?";
        $params = [$uid];

        if ($platform && $platform !== 'All') {
            $sql .= " AND p.platform = ?";
            $params[] = $platform;
        }
        if ($difficulty && $difficulty !== 'All') {
            $sql .= " AND p.difficulty = ?";
            $params[] = $difficulty;
        }
        if ($status && $status !== 'All') {
            $sql .= " AND p.status = ?";
            $params[] = $status;
        }
        if ($search) {
            $sql .= " AND (p.title LIKE ? OR p.notes LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
        $sql .= " ORDER BY p.id DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $problems = $stmt->fetchAll();

        $stats = getStats($db, $uid);
        send(true, 'Practice problems retrieved', [
            'problems' => $problems,
            'summary' => $stats['practice'],
            'stats' => $stats['practice']
        ]);
        break;

    case 'add_practice_problem':
        $uid = getUserId();
        $title = trim($data['title'] ?? '');
        $platform = trim($data['platform'] ?? 'LeetCode');
        $url = trim($data['problem_url'] ?? '');
        $diff = trim($data['difficulty'] ?? 'Easy');
        $status = trim($data['status'] ?? 'Unstarted');
        $notes = trim($data['notes'] ?? '');
        $topicId = !empty($data['topic_id']) ? (int)$data['topic_id'] : null;

        if (!$title) send(false, 'Title is required.', [], 422);

        $stmt = $db->prepare("INSERT INTO practice_problems (user_id, topic_id, title, platform, problem_url, difficulty, status, notes, updated_at)
                              VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())");
        $stmt->execute([$uid, $topicId, $title, $platform, $url, $diff, $status, $notes]);
        send(true, 'Problem added', ['problem_id' => (int)$db->lastInsertId()], 201);
        break;

    case 'edit_practice_problem':
        $uid = getUserId();
        $id = (int)($data['id'] ?? 0);
        $title = trim($data['title'] ?? '');
        $platform = trim($data['platform'] ?? 'LeetCode');
        $url = trim($data['problem_url'] ?? '');
        $diff = trim($data['difficulty'] ?? 'Easy');
        $status = trim($data['status'] ?? 'Unstarted');
        $notes = trim($data['notes'] ?? '');
        $topicId = !empty($data['topic_id']) ? (int)$data['topic_id'] : null;
        checkOwner($db, 'practice_problems', $id, $uid);

        $stmt = $db->prepare("UPDATE practice_problems SET topic_id = ?, title = ?, platform = ?, problem_url = ?, difficulty = ?, status = ?, notes = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$topicId, $title, $platform, $url, $diff, $status, $notes, $id]);
        send(true, 'Problem updated');
        break;

    case 'delete_practice_problem':
        $uid = getUserId();
        $id = (int)($data['id'] ?? 0);
        checkOwner($db, 'practice_problems', $id, $uid);

        $db->prepare("DELETE FROM practice_problems WHERE id = ?")->execute([$id]);
        send(true, 'Problem deleted');
        break;

    case 'mistakes':
        $uid = getUserId();
        $revised = isset($data['is_revised']) && $data['is_revised'] !== '' ? $data['is_revised'] : 'all';
        $search = trim($data['search'] ?? '');

        $sql = "SELECT m.*, t.title AS topic_title FROM mistake_notes m
                LEFT JOIN topics t ON t.id = m.topic_id
                WHERE m.user_id = ?";
        $params = [$uid];

        if ($revised !== 'all') {
            $sql .= " AND m.is_revised = ?";
            $params[] = (int)$revised;
        }
        if ($search) {
            $sql .= " AND (m.title LIKE ? OR m.mistake_description LIKE ? OR m.correct_approach LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
        $sql .= " ORDER BY m.id DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $mistakes = $stmt->fetchAll();

        $stats = getStats($db, $uid);
        send(true, 'Mistakes retrieved', [
            'mistakes' => $mistakes,
            'summary' => $stats['mistakes'],
            'stats' => $stats['mistakes']
        ]);
        break;

    case 'add_mistake':
        $uid = getUserId();
        $title = trim($data['title'] ?? '');
        $lang = trim($data['language'] ?? 'Java');
        $desc = trim($data['mistake_description'] ?? '');
        $correct = trim($data['correct_approach'] ?? '');
        $isRev = !empty($data['is_revised']) ? 1 : 0;
        $topicId = !empty($data['topic_id']) ? (int)$data['topic_id'] : null;

        if (!$title || !$desc) send(false, 'Title and description required.', [], 422);

        $stmt = $db->prepare("INSERT INTO mistake_notes (user_id, topic_id, title, language, mistake_description, correct_approach, is_revised, created_at)
                              VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
        $stmt->execute([$uid, $topicId, $title, $lang, $desc, $correct, $isRev]);
        send(true, 'Mistake added', ['mistake_id' => (int)$db->lastInsertId()], 201);
        break;

    case 'edit_mistake':
        $uid = getUserId();
        $id = (int)($data['id'] ?? 0);
        $title = trim($data['title'] ?? '');
        $lang = trim($data['language'] ?? 'Java');
        $desc = trim($data['mistake_description'] ?? '');
        $correct = trim($data['correct_approach'] ?? '');
        $isRev = !empty($data['is_revised']) ? 1 : 0;
        $topicId = !empty($data['topic_id']) ? (int)$data['topic_id'] : null;
        checkOwner($db, 'mistake_notes', $id, $uid);

        $stmt = $db->prepare("UPDATE mistake_notes SET topic_id = ?, title = ?, language = ?, mistake_description = ?, correct_approach = ?, is_revised = ? WHERE id = ?");
        $stmt->execute([$topicId, $title, $lang, $desc, $correct, $isRev, $id]);
        send(true, 'Mistake updated');
        break;

    case 'toggle_mistake_revised':
        $uid = getUserId();
        $id = (int)($data['id'] ?? 0);
        $rev = !empty($data['is_revised']) ? 1 : 0;
        checkOwner($db, 'mistake_notes', $id, $uid);

        $stmt = $db->prepare("UPDATE mistake_notes SET is_revised = ? WHERE id = ?");
        $stmt->execute([$rev, $id]);
        send(true, 'Mistake revision updated', ['id' => $id, 'is_revised' => (bool)$rev]);
        break;

    case 'delete_mistake':
        $uid = getUserId();
        $id = (int)($data['id'] ?? 0);
        checkOwner($db, 'mistake_notes', $id, $uid);

        $db->prepare("DELETE FROM mistake_notes WHERE id = ?")->execute([$id]);
        send(true, 'Mistake deleted');
        break;

    case 'progress':
        $uid = getUserId();
        $stats = getStats($db, $uid);

        $tracks = $db->query("SELECT id, title FROM tracks ORDER BY position ASC, id ASC")->fetchAll();
        $tracksProgress = [];
        foreach ($tracks as $tr) {
            $trId = (int)$tr['id'];
            $stmt = $db->prepare("SELECT t.id FROM tasks t JOIN topics top ON top.id = t.topic_id WHERE top.track_id = ? AND (t.user_id IS NULL OR t.user_id = ?)");
            $stmt->execute([$trId, $uid]);
            $taskIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
            $total = count($taskIds);
            $comp = 0;
            if ($total > 0) {
                $inList = implode(',', array_map('intval', $taskIds));
                $comp = (int)$db->query("SELECT COUNT(DISTINCT task_id) FROM user_task_progress WHERE user_id = $uid AND is_completed = 1 AND task_id IN ($inList)")->fetchColumn();
            }
            $pct = $total > 0 ? round(($comp / $total) * 100, 1) : 0;
            $tracksProgress[] = [
                'id' => $trId,
                'title' => $tr['title'],
                'total_tasks' => $total,
                'completed_tasks' => $comp,
                'percentage' => $pct
            ];
        }

        $stmt = $db->prepare("SELECT id, title FROM topics WHERE user_id IS NULL OR user_id = ? ORDER BY track_id ASC, position ASC LIMIT 10");
        $stmt->execute([$uid]);
        $topTopics = $stmt->fetchAll();
        $topicsProgress = [];
        foreach ($topTopics as $top) {
            $topId = (int)$top['id'];
            $stmt = $db->prepare("SELECT id FROM tasks WHERE topic_id = ? AND (user_id IS NULL OR user_id = ?)");
            $stmt->execute([$topId, $uid]);
            $tIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
            $tot = count($tIds);
            $c = 0;
            if ($tot > 0) {
                $inList = implode(',', array_map('intval', $tIds));
                $c = (int)$db->query("SELECT COUNT(DISTINCT task_id) FROM user_task_progress WHERE user_id = $uid AND is_completed = 1 AND task_id IN ($inList)")->fetchColumn();
            }
            $p = $tot > 0 ? round(($c / $tot) * 100, 1) : 0;
            $topicsProgress[] = [
                'id' => $topId,
                'title' => $top['title'],
                'total_tasks' => $tot,
                'completed_tasks' => $c,
                'percentage' => $p
            ];
        }

        send(true, 'Progress analytics retrieved', [
            'stats' => $stats,
            'tracks' => $tracksProgress,
            'topics' => $topicsProgress,
            'tasks' => $stats['tasks'],
            'practice' => $stats['practice'],
            'flashcards' => $stats['flashcards'],
            'mistakes' => $stats['mistakes']
        ]);
        break;

    default:
        send(false, 'Invalid API action requested: ' . htmlspecialchars($action), [], 400);
}

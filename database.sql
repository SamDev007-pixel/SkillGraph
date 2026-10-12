CREATE DATABASE IF NOT EXISTS `skillgraph` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `skillgraph`;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tracks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(150) NOT NULL,
  `description` TEXT,
  `position` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `topics` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `track_id` INT NOT NULL,
  `user_id` INT NULL,
  `title` VARCHAR(150) NOT NULL,
  `description` TEXT,
  `position` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_topics_track` (`track_id`),
  INDEX `idx_topics_user` (`user_id`),
  CONSTRAINT `fk_topics_track` FOREIGN KEY (`track_id`) REFERENCES `tracks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_topics_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `topic_id` INT NOT NULL,
  `user_id` INT NULL,
  `title` VARCHAR(255) NOT NULL,
  `is_completed` TINYINT(1) DEFAULT 0,
  `position` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_tasks_topic` (`topic_id`),
  INDEX `idx_tasks_user` (`user_id`),
  CONSTRAINT `fk_tasks_topic` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tasks_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_task_progress` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `task_id` INT NOT NULL,
  `is_completed` TINYINT(1) NOT NULL DEFAULT 1,
  `completed_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_task` (`user_id`, `task_id`),
  INDEX `idx_utp_user` (`user_id`),
  INDEX `idx_utp_task` (`task_id`),
  CONSTRAINT `fk_utp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_utp_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `flashcards` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `topic_id` INT NULL,
  `question` TEXT NOT NULL,
  `answer` TEXT NOT NULL,
  `category` VARCHAR(100) DEFAULT 'General',
  `is_reviewed` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_flashcards_user` (`user_id`),
  INDEX `idx_flashcards_topic` (`topic_id`),
  INDEX `idx_flashcards_cat` (`category`),
  CONSTRAINT `fk_flashcards_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_flashcards_topic` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_flashcard_reviews` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `flashcard_id` INT NOT NULL,
  `is_reviewed` TINYINT(1) NOT NULL DEFAULT 1,
  `reviewed_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_card` (`user_id`, `flashcard_id`),
  INDEX `idx_ufr_user` (`user_id`),
  INDEX `idx_ufr_card` (`flashcard_id`),
  CONSTRAINT `fk_ufr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ufr_card` FOREIGN KEY (`flashcard_id`) REFERENCES `flashcards` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `practice_problems` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `platform` VARCHAR(50) NOT NULL,
  `problem_url` VARCHAR(500) NOT NULL,
  `difficulty` ENUM('Easy', 'Medium', 'Hard') NOT NULL DEFAULT 'Easy',
  `topic_id` INT NULL,
  `status` ENUM('Not Started', 'Attempted', 'Solved') NOT NULL DEFAULT 'Not Started',
  `notes` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_practice_user` (`user_id`),
  INDEX `idx_practice_status` (`status`),
  CONSTRAINT `fk_practice_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_practice_topic` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `mistake_notes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `language` VARCHAR(50) NOT NULL,
  `mistake_description` TEXT NOT NULL,
  `correct_approach` TEXT NOT NULL,
  `topic_id` INT NULL,
  `is_revised` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_mistakes_user` (`user_id`),
  INDEX `idx_mistakes_revised` (`is_revised`),
  CONSTRAINT `fk_mistakes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mistakes_topic` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `created_at`) VALUES
(1, 'Alex Morgan', 'demo@skillgraph.local', '$2y$10$6lLkgBQ6lcsk7MM5nfLrceO.Bz6W8VhMNVQPs3iTZb5QlI8UPuGN.', NOW())
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

INSERT INTO `tracks` (`id`, `title`, `description`, `position`) VALUES
(1, 'Java Fundamentals', 'Core Java syntax, OOP concepts, Collections Framework, memory management, and exceptions.', 1),
(2, 'Arrays and Strings', 'Array manipulations, frequency maps, prefix sums, strings, and character encodings.', 2),
(3, 'Searching and Sorting', 'Linear/Binary search, quicksort, mergesort, custom comparators, and search space reduction.', 3),
(4, 'Two Pointers and Sliding Window', 'Opposite-direction pointers, fast & slow pointers, fixed and variable window techniques.', 4),
(5, 'Stack and Queue', 'LIFO/FIFO patterns, monotonic stacks, parentheses matching, and queue BFS primitives.', 5),
(6, 'HashMap and HashSet', 'O(1) lookups, hashing collision handling, frequency counting, and two-sum patterns.', 6),
(7, 'Recursion and Backtracking', 'Call stack mechanics, decision trees, permutations, combinations, and pruning techniques.', 7),
(8, 'Linked Lists', 'Singly & doubly linked lists, pointer rewiring, cycle detection, and list reversal.', 8),
(9, 'Trees and Binary Search Trees', 'DFS, BFS level order, BST properties, LCA, tree serialization, and height balance.', 9),
(10, 'Graphs', 'Adjacency lists, BFS, DFS, cycle detection, topological sort, Dijkstra, and Union-Find.', 10),
(11, 'Greedy Algorithms', 'Interval scheduling, activity selection, Huffman coding, and local optimum strategies.', 11),
(12, 'Dynamic Programming', 'Memoization, tabulation, knapsack patterns, longest common subsequence, and state transitions.', 12)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

INSERT INTO `topics` (`id`, `track_id`, `user_id`, `title`, `description`, `position`) VALUES
(1, 1, NULL, 'OOP Principles & Memory Model', 'Encapsulation, inheritance, polymorphism, heap vs stack memory.', 1),
(2, 1, NULL, 'Java Collections Framework', 'ArrayList, LinkedList, HashMap internals, Set, PriorityQueue.', 2),
(3, 2, NULL, 'Basic Array Manipulations', 'In-place rotations, prefix sums, Kadane algorithm.', 1),
(4, 2, NULL, 'String Matching & Manipulation', 'String builder, palindrome checks, anagram frequencies.', 2),
(5, 3, NULL, 'Binary Search Variations', 'Standard BS, first/last occurrences, search in rotated sorted array.', 1),
(6, 3, NULL, 'Sorting Mechanics', 'QuickSort partitioning, MergeSort divide-and-conquer, Inversion count.', 2),
(7, 4, NULL, 'Two Pointers Technique', 'Opposite-direction and same-direction two-pointer patterns.', 1),
(8, 4, NULL, 'Sliding Window Patterns', 'Fixed window sums, variable window substring problems.', 2),
(9, 5, NULL, 'Monotonic Stack Patterns', 'Next Greater Element, Daily Temperatures, Largest Rectangle in Histogram.', 1),
(10, 5, NULL, 'Queue and Deque Operations', 'Sliding Window Maximum, BFS level order queue primitives.', 2),
(11, 6, NULL, 'Hashing & Frequency Counting', 'Two Sum, Subarray Sum Equals K with prefix sums.', 1),
(12, 7, NULL, 'Subsets & Permutations', 'Power set generation, N-Queens problem, backtracking state restoration.', 1),
(13, 8, NULL, 'Pointer Rewiring & Reversal', 'Reverse linked list in-place, reverse in K-groups, palindrome list.', 1),
(14, 8, NULL, 'Fast and Slow Pointers', 'Cycle detection (Floyd Cycle Finding), middle node discovery.', 2),
(15, 9, NULL, 'Tree Traversals (DFS & BFS)', 'Pre/In/Postorder iterative & recursive, level order traversal.', 1),
(16, 9, NULL, 'Binary Search Tree Operations', 'Validate BST, LCA of BST, insert/delete nodes.', 2),
(17, 10, NULL, 'Graph Traversal (BFS & DFS)', 'Connected components, bipartite graph check, flood fill.', 1),
(18, 10, NULL, 'Shortest Path & Topological Sort', 'Dijkstra algorithm, Kahn algorithm for DAG ordering.', 2),
(19, 11, NULL, 'Interval Scheduling & Sorting', 'Merge intervals, non-overlapping intervals, gas station.', 1),
(20, 12, NULL, '1D Dynamic Programming', 'Climbing stairs, House Robber, Coin Change.', 1),
(21, 12, NULL, '2D DP & Knapsack Patterns', '0/1 Knapsack, Longest Common Subsequence, Edit Distance.', 2)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

INSERT INTO `tasks` (`id`, `topic_id`, `user_id`, `title`, `position`) VALUES
(1, 1, NULL, 'Understand classes, objects, and constructor chaining', 1),
(2, 1, NULL, 'Implement abstract classes vs interfaces with default methods', 2),
(3, 1, NULL, 'Explain Heap vs Stack memory allocation and garbage collection', 3),
(4, 1, NULL, 'Master pass-by-value semantics in Java object references', 4),
(5, 2, NULL, 'Understand HashMap hash collision resolution (buckets & red-black trees)', 1),
(6, 2, NULL, 'Compare ArrayList vs LinkedList time complexities', 2),
(7, 2, NULL, 'Implement custom sorting using Comparable and Comparator', 3),
(8, 2, NULL, 'Utilize PriorityQueue (Min-Heap / Max-Heap) with custom lambda', 4),
(9, 3, NULL, 'Find minimum and maximum element in an array with minimal comparisons', 1),
(10, 3, NULL, 'Reverse an array in-place without auxiliary memory', 2),
(11, 3, NULL, 'Compute Prefix Sum array for O(1) range queries', 3),
(12, 3, NULL, 'Implement Kadane algorithm for Maximum Subarray problem', 4),
(13, 4, NULL, 'Check if two strings are valid anagrams using frequency arrays', 1),
(14, 4, NULL, 'Find Longest Common Prefix among array of strings', 2),
(15, 4, NULL, 'Implement string compression and avoid String concatenation in loops', 3),
(16, 5, NULL, 'Implement classic Binary Search with overflow-safe mid calculation', 1),
(17, 5, NULL, 'Find First and Last Position of Element in Sorted Array', 2),
(18, 5, NULL, 'Search in Rotated Sorted Array', 3),
(19, 5, NULL, 'Find Peak Element using logarithmic search', 4),
(20, 6, NULL, 'Implement MergeSort and count array inversions', 1),
(21, 6, NULL, 'Implement QuickSort with Lomuto and Hoare partitioning', 2),
(22, 6, NULL, 'Solve Dutch National Flag problem (sort 0s, 1s, and 2s)', 3),
(23, 7, NULL, 'Understand opposite-direction two pointer technique', 1),
(24, 7, NULL, 'Solve Two Sum II (Input Array Is Sorted)', 2),
(25, 7, NULL, 'Implement 3Sum avoiding duplicate triplets', 3),
(26, 7, NULL, 'Solve Container With Most Water', 4),
(27, 7, NULL, 'Solve Valid Palindrome with non-alphanumeric filtering', 5),
(28, 8, NULL, 'Understand fixed-size sliding window (Maximum Sum Subarray of Size K)', 1),
(29, 8, NULL, 'Implement Longest Substring Without Repeating Characters', 2),
(30, 8, NULL, 'Solve Minimum Window Substring using frequency maps', 3),
(31, 9, NULL, 'Understand Monotonic Decreasing vs Increasing stack invariant', 1),
(32, 9, NULL, 'Solve Next Greater Element I and II (circular array)', 2),
(33, 9, NULL, 'Solve Daily Temperatures problem', 3),
(34, 9, NULL, 'Solve Largest Rectangle in Histogram', 4),
(35, 10, NULL, 'Implement Queue using Stacks and analyze amortized complexity', 1),
(36, 10, NULL, 'Solve Sliding Window Maximum using monotonic double-ended queue', 2),
(37, 11, NULL, 'Solve Two Sum using one-pass hash table', 1),
(38, 11, NULL, 'Solve Subarray Sum Equals K using prefix sum + hash frequency map', 2),
(39, 11, NULL, 'Solve Longest Consecutive Sequence in O(n) time', 3),
(40, 12, NULL, 'Draw recursive call tree for Subsets and analyze 2^N complexity', 1),
(41, 12, NULL, 'Solve Permutations with backtracking state rollback', 2),
(42, 12, NULL, 'Solve Combination Sum with unbounded choices', 3),
(43, 12, NULL, 'Implement N-Queens with board validation diagonals', 4),
(44, 13, NULL, 'Reverse a singly linked list iteratively and recursively', 1),
(45, 13, NULL, 'Reverse nodes in K-Group', 2),
(46, 13, NULL, 'Check if a linked list is a palindrome', 3),
(47, 14, NULL, 'Detect cycle in linked list using Floyd Cycle-Finding algorithm', 1),
(48, 14, NULL, 'Find starting node of the cycle in linked list', 2),
(49, 14, NULL, 'Find middle of linked list in a single pass', 3),
(50, 15, NULL, 'Implement Binary Tree Inorder, Preorder, Postorder recursively & iteratively', 1),
(51, 15, NULL, 'Implement Level Order Traversal (BFS) using queue', 2),
(52, 15, NULL, 'Compute Maximum Depth and Diameter of Binary Tree', 3),
(53, 16, NULL, 'Validate Binary Search Tree using min/max range constraints', 1),
(54, 16, NULL, 'Find Lowest Common Ancestor (LCA) in BST vs general Binary Tree', 2),
(55, 17, NULL, 'Build Graph Adjacency List and implement BFS and DFS traversals', 1),
(56, 17, NULL, 'Detect cycle in undirected graph using BFS / Union-Find', 2),
(57, 17, NULL, 'Detect cycle in directed graph using DFS 3-color states', 3),
(58, 18, NULL, 'Implement Topological Sort using Kahn algorithm (in-degrees)', 1),
(59, 18, NULL, 'Implement Dijkstra algorithm for shortest paths with PriorityQueue', 2),
(60, 19, NULL, 'Solve Merge Intervals by sorting start times', 1),
(61, 19, NULL, 'Solve Non-overlapping Intervals (activity selection)', 2),
(62, 20, NULL, 'Identify overlapping subproblems and optimal substructure', 1),
(63, 20, NULL, 'Solve Climbing Stairs: Recursion -> Memoization -> Tabulation', 2),
(64, 20, NULL, 'Solve House Robber and optimize space to O(1)', 3),
(65, 20, NULL, 'Solve Coin Change (fewest coins to make amount)', 4),
(66, 21, NULL, 'Solve 0/1 Knapsack with 2D and 1D rolling array tabulation', 1),
(67, 21, NULL, 'Solve Longest Common Subsequence (LCS)', 2),
(68, 21, NULL, 'Solve Edit Distance (Levenshtein Distance)', 3)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

INSERT INTO `flashcards` (`id`, `user_id`, `topic_id`, `question`, `answer`, `category`) VALUES
(1, NULL, 1, 'What is the key difference between == and .equals() in Java?', '== compares object memory addresses. .equals() compares actual content when overridden (e.g. in String, Integer).', 'Java'),
(2, NULL, 1, 'Why are String objects immutable in Java?', 'Strings are immutable for security, thread safety, string pool caching, and safe HashMap key hashing.', 'Java'),
(3, NULL, 2, 'How does a Java HashMap handle collisions internally?', 'HashMap uses separate chaining (linked list buckets). In Java 8+, buckets with 8+ entries convert to Red-Black Trees (TreeMap nodes) for O(log n) lookups.', 'Collections'),
(4, NULL, 2, 'What is the time complexity of ArrayList get() vs LinkedList get()?', 'ArrayList get(i) is O(1) random access. LinkedList get(i) is O(n) because it traverses from head/tail.', 'Collections'),
(5, NULL, 3, 'What is Kadane’s Algorithm and what is its complexity?', 'Kadane’s finds the maximum contiguous subarray sum in O(n) time and O(1) space via currentMax = max(nums[i], currentMax + nums[i]).', 'Algorithms'),
(6, NULL, 5, 'How do you avoid integer overflow when computing midpoint in Binary Search?', 'Use mid = low + (high - low) / 2 instead of (low + high) / 2 to avoid exceeding Integer.MAX_VALUE.', 'Algorithms'),
(7, NULL, 7, 'When should you choose the Two Pointers technique?', 'Use Two Pointers on sorted arrays/sequences for pair/triplet sums, in-place reversals, or partitioning problems.', 'Techniques'),
(8, NULL, 8, 'What is the template for a Variable-Size Sliding Window?', 'Expand right pointer to include elements; while window invariant is violated, shrink left pointer and update state.', 'Techniques'),
(9, NULL, 9, 'What is a Monotonic Stack and what is its primary use case?', 'A stack with elements strictly increasing or decreasing. Optimal for Next Greater / Previous Smaller Element in O(n) time.', 'Data Structures'),
(10, NULL, 13, 'How do you reverse a singly linked list in O(n) time and O(1) memory?', 'prev = null, curr = head. In loop: next = curr.next; curr.next = prev; prev = curr; curr = next. Return prev as head.', 'Data Structures'),
(11, NULL, 14, 'How does Floyd’s Cycle Detection (Tortoise and Hare) work?', 'Use slow (1 step) and fast (2 steps) pointers. If a cycle exists, fast will lap slow and collide. If fast hits null, no cycle.', 'Algorithms'),
(12, NULL, 16, 'How do you correctly validate if a binary tree is a BST?', 'Pass valid range constraints (min, max) to each child: validate(node.left, min, node.val) && validate(node.right, node.val, max).', 'Trees'),
(13, NULL, 18, 'When can Topological Sort be performed on a graph?', 'Topological sort is strictly valid ONLY on Directed Acyclic Graphs (DAGs). Graphs with cycles cannot be sorted.', 'Graphs'),
(14, NULL, 20, 'What are the two core properties required for Dynamic Programming?', '1. Optimal Substructure (optimal solution contains optimal subproblem solutions). 2. Overlapping Subproblems (subproblems repeat).', 'Dynamic Programming'),
(15, NULL, 2, 'What is the contract between equals() and hashCode() in Java?', 'If a.equals(b) is true, then a.hashCode() MUST equal b.hashCode(). The reverse is not required (hash collisions).', 'Java'),
(16, NULL, 10, 'Why is Dijkstra’s algorithm not suitable for graphs with negative edges?', 'Dijkstra assumes settled nodes have finalized shortest distances. Negative edges can subsequently reduce distance, invalidating greedy choices.', 'Graphs')
ON DUPLICATE KEY UPDATE `question`=VALUES(`question`);

INSERT INTO `practice_problems` (`id`, `user_id`, `title`, `platform`, `problem_url`, `difficulty`, `topic_id`, `status`, `notes`) VALUES
(1, 1, 'Two Sum', 'LeetCode', 'https://leetcode.com/problems/two-sum/', 'Easy', 11, 'Solved', 'Used HashMap to store complement values for O(n) single pass.'),
(2, 1, 'Valid Palindrome', 'LeetCode', 'https://leetcode.com/problems/valid-palindrome/', 'Easy', 7, 'Solved', 'Two pointers skipping non-alphanumeric chars with Character.isLetterOrDigit.'),
(3, 1, 'Longest Substring Without Repeating Characters', 'LeetCode', 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', 'Medium', 8, 'Solved', 'Sliding window with last-seen index map. Shrink window on duplicates.'),
(4, 1, 'Merge Two Sorted Lists', 'LeetCode', 'https://leetcode.com/problems/merge-two-sorted-lists/', 'Easy', 13, 'Solved', 'Dummy head node pattern avoids null edge cases.'),
(5, 1, 'Search in Rotated Sorted Array', 'LeetCode', 'https://leetcode.com/problems/search-in-rotated-sorted-array/', 'Medium', 5, 'Attempted', 'Check which half is strictly sorted first before narrowing range.'),
(6, 1, 'Coin Change', 'LeetCode', 'https://leetcode.com/problems/coin-change/', 'Medium', 20, 'Attempted', 'Bottom-up DP with array initialized to amount + 1.'),
(7, 1, 'Trapping Rain Water', 'LeetCode', 'https://leetcode.com/problems/trapping-rain-water/', 'Hard', 7, 'Not Started', 'Planned: Two pointers approach with leftMax and rightMax.')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

INSERT INTO `mistake_notes` (`id`, `user_id`, `title`, `language`, `mistake_description`, `correct_approach`, `topic_id`, `is_revised`) VALUES
(1, 1, 'Integer Overflow in Binary Search Mid Calculation', 'Java', 'Used int mid = (low + high) / 2; which overflowed Integer.MAX_VALUE with large indices.', 'Always compute mid using int mid = low + (high - low) / 2; or (low + high) >>> 1.', 5, 1),
(2, 1, 'Modifying List During Enhanced For Loop', 'Java', 'Removed items inside for (String s : list) loop, throwing ConcurrentModificationException.', 'Use Iterator.remove() explicitly or list.removeIf(predicate) in modern Java.', 2, 1),
(3, 1, 'Null Pointer in Linked List Fast-Slow Pointer', 'Java', 'Wrote while (fast.next != null && fast.next.next != null) without verifying fast != null first.', 'Check while (fast != null && fast.next != null) { slow = slow.next; fast = fast.next.next; }.', 14, 0),
(4, 1, 'Shallow Copying 2D DP Array in Java', 'Java', 'Used dp.clone() expecting independent 2D matrix, but only cloned row references.', 'Must clone each row individually: for(int i=0; i<m; i++) copy[i] = dp[i].clone();', 21, 0)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

INSERT INTO `user_task_progress` (`user_id`, `task_id`, `is_completed`) VALUES
(1, 1, 1), (1, 2, 1), (1, 5, 1), (1, 9, 1), (1, 10, 1), (1, 11, 1), (1, 12, 1), (1, 13, 1),
(1, 16, 1), (1, 23, 1), (1, 24, 1), (1, 27, 1), (1, 28, 1), (1, 29, 1), (1, 37, 1), (1, 44, 1), (1, 47, 1), (1, 49, 1)
ON DUPLICATE KEY UPDATE `is_completed`=VALUES(`is_completed`);

INSERT INTO `user_flashcard_reviews` (`user_id`, `flashcard_id`, `is_reviewed`) VALUES
(1, 1, 1), (1, 2, 1), (1, 3, 1), (1, 5, 1), (1, 6, 1), (1, 7, 1), (1, 10, 1), (1, 11, 1)
ON DUPLICATE KEY UPDATE `is_reviewed`=VALUES(`is_reviewed`);

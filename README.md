# SkillGraph — The Coding Learning & Practice Platform

> **Tagline:** Learn concepts. Connect patterns. Master problems.

SkillGraph is a full-stack web application designed for computer science students and placement aspirants. It helps students systematically prepare for coding assessments (such as Code Red, technical rounds, and coding competitions), master Data Structures and Algorithms (DSA), revise core Java concepts, practice problems on external coding platforms, record and analyze mistakes, and monitor real-time learning progress.

---

## 1. Project Overview

Preparing for technical interviews and programming assessments requires consistent practice across data structures, problem patterns, and language fundamentals. Students often struggle with:
- Lacking a structured progression from fundamentals to advanced algorithmic techniques.
- Forgetting core theoretical concepts and language invariants between practice sessions.
- Losing track of problems solved across multiple competitive programming platforms.
- Repeating the same coding bugs, edge case mistakes, and language traps.

**SkillGraph** addresses these challenges by consolidating the student's entire learning workflow into a unified, distraction-free environment:
- **12 Structured Learning Tracks** with curated topics and subtask checklists.
- **Interactive 3D Flashcards** for active recall and concept revision.
- **Practice Hub** integrating external practice links with problem records and personal notes.
- **Mistake & Revision Journal** turning erroneous submissions into lasting lessons.
- **Quantitative Progress Dashboard** calculating real-time completion percentages and topic mastery.
- **Permanent Dark Theme** adhering to a sleek coding interface inspired by modern programming platforms.

---

## 2. Feature List

### 1. Authentication & Session Management
- Secure user registration with validation (name, email format, minimum password length).
- Password hashing using PHP `password_hash()` (bcrypt).
- Session-based authentication with `session_regenerate_id()` on login to prevent session fixation.
- Token-based CSRF protection on state-changing API operations.
- Server-side resource ownership verification for all user-created content.
- Clean logout destroying session cookies and backend state.

### 2. Main Dashboard (`index.html`)
- Personalized welcome greeting with student name.
- Summary metrics: Completed tasks, remaining tasks, problems solved, flashcards reviewed, and pending mistakes.
- Visual overall roadmap completion progress bar.
- Active learning tracks widget with percentage bars.
- Recent practice problem recordings and recent mistake notes.
- One-click shortcuts to external coding platforms (LeetCode, HackerRank, CodeChef, GeeksforGeeks).

### 3. Structured Learning Roadmap (`roadmap.html`)
- 12 comprehensive computer science tracks:
  1. Java Fundamentals
  2. Arrays and Strings
  3. Searching and Sorting
  4. Two Pointers and Sliding Window
  5. Stack and Queue
  6. HashMap and HashSet
  7. Recursion and Backtracking
  8. Linked Lists
  9. Trees and Binary Search Trees
  10. Graphs
  11. Greedy Algorithms
  12. Dynamic Programming
- Accordion interface showing topics and checklist subtasks under each track.
- Core starter content clearly distinguished from custom user content with badges.
- Checkbox interaction: ticking subtasks immediately updates MySQL progress and recalculates track and topic completion percentages.
- Full CRUD for personal topics and personal subtasks. Starter content is protected from accidental modification or deletion.

### 4. Concept Revision Flashcards (`flashcards.html`)
- 3D flip card animation revealing answers and technical explanations.
- Interactive controls: Spacebar to flip, Arrow keys (&larr; / &rarr;) to navigate between cards.
- Filter by topic/category (e.g. Java, Collections, Algorithms, Trees, Graphs, Techniques).
- Filter by status: All, Reviewed, or Unreviewed.
- Mark cards as reviewed with persistent per-user review state in MySQL.
- Full CRUD support for creating, editing, and deleting personal flashcards.

### 5. Coding Practice Hub (`practice.html`)
- Quick-launch external links to LeetCode, HackerRank, CodeChef, and GeeksforGeeks opening in secure new tabs (`rel="noopener noreferrer"`).
- Problem tracking fields: Title, Platform, Problem URL, Difficulty (Easy, Medium, Hard), Status (Not Started, Attempted, Solved), Topic, and Notes.
- Inline status dropdown for instant status updates.
- Real-time search by problem title or keyword, and filtering by platform, difficulty, and status.
- Summary counters for total problems, solved, attempted, and unstarted.

### 6. Mistake & Revision Journal (`mistakes.html`)
- Designed specifically to eliminate repetitive errors in placement assessments.
- Distinct highlighted visual blocks:
  - **What Went Wrong / Trap Encountered** (highlighted in error tint)
  - **Correct Approach & Key Lesson** (highlighted in success tint)
- Categorized by programming language (Java, C++, Python, JavaScript, General).
- Revision status toggle: One-click "Mark Revised" or "Pending Revision".
- Search and filtering by keyword, language, and revision state.

### 7. Preparation Progress Analytics (`progress.html`)
- Quantitative statistics derived exclusively from actual MySQL records.
- Zero-division-safe calculations across empty and filled datasets.
- Core milestone completion percentage and practice problem solved rate.
- Difficulty breakdown audit (Easy, Medium, Hard problems solved).
- Retention & mistake mastery progress bars.
- Track-by-track and topic-by-topic granular completion table.

### 8. Permanent Dark Theme
- **Main background:** `#1A1A1A`
- **Card and panel background:** `#222222`
- **Secondary surface:** `#262626`
- **Primary text:** `#F5F5F5`
- **Secondary text:** `#929292`
- **Borders:** `#353535`
- **Primary accent:** `#FFA116`
- **Success:** `#00B8A9`
- **Error:** `#F05252`
- Applied consistently across all pages with zero light-theme flash on initial render.

---

## 3. Technology Stack

- **Frontend:**
  - HTML5 (Semantic, accessible markup with unique element IDs)
  - CSS3 (Vanilla CSS with CSS variables, 3D transform animations, glassmorphism accents)
  - Vanilla JavaScript (ES6+ `fetch()` API, modular functions, event delegation, safe DOM rendering)
  - Bootstrap 5.3.3 (Responsive grid layout, modals, dropdowns, and collapse accordions)
  - Bootstrap Icons (Vector iconography)
- **Backend:**
  - PHP 8+ (Clean procedural controllers with strict error handling)
  - PHP PDO (PHP Data Objects) with 100% prepared statements
  - PHP native sessions with secure cookie parameters
- **Database:**
  - MySQL 8.0+ / MariaDB (InnoDB engine, utf8mb4 encoding, foreign keys with cascading actions)
- **Target Development Environment:**
  - XAMPP (Apache + PHP + MySQL)

---

## 4. Folder Structure

```text
skillgraph/
├── index.html          # Main dashboard & activity overview
├── login.html          # User sign-in page with demo quick-fill
├── register.html       # New student registration page
├── roadmap.html        # 12 structured tracks, topics, and subtask checklists
├── flashcards.html     # 3D interactive flashcards for concept revision
├── practice.html       # Coding practice tracker & external platform links
├── mistakes.html       # Personal mistake journal & revision status tracker
├── progress.html       # Quantitative progress analytics & topic audit
├── style.css           # Design system tokens and permanent dark theme styling
├── script.js           # Shared JavaScript application logic & API fetch layer
├── db.php              # PDO database connection & error handling
├── api.php             # Unified backend RESTful JSON API
├── database.sql        # Database schema, indexes, and starter demo records
└── README.md           # Documentation, setup guide, and testing procedures
```

---

## 5. Prerequisites

Before setting up SkillGraph, ensure the following are installed:
1. **XAMPP** (with PHP 8.0+ and MySQL / MariaDB).
2. A modern web browser (Google Chrome, Mozilla Firefox, Microsoft Edge, or Safari).

---

## 6. XAMPP Installation and Setup

1. Download XAMPP for Windows from [Apache Friends](https://www.apachefriends.org/).
2. Run the installer and select at least **Apache**, **MySQL**, and **PHP**.
3. Complete the installation (default location is typically `C:\xampp`).
4. Launch the **XAMPP Control Panel**.
5. Click **Start** next to **Apache** (default port: 80 / 443).
6. Click **Start** next to **MySQL** (default port: 3306).

---

## 7. How to Create the MySQL Database

### Option A: Using phpMyAdmin (Recommended for GUI)
1. Open your browser and navigate to `http://localhost/phpmyadmin/`.
2. In the left sidebar, click **New**.
3. Under **Database name**, enter: `skillgraph`.
4. Under **Collation**, select: `utf8mb4_unicode_ci`.
5. Click **Create**.

### Option B: Using MySQL Command Line
1. Open PowerShell or Command Prompt.
2. Run:
   ```cmd
   mysql -u root -p
   ```
   *(Press Enter if no password is set)*
3. Execute the SQL command:
   ```sql
   CREATE DATABASE IF NOT EXISTS `skillgraph` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

---

## 8. How to Import `database.sql`

### Using phpMyAdmin
1. Open `http://localhost/phpmyadmin/`.
2. Select the `skillgraph` database from the left navigation panel.
3. Click the **Import** tab in the top navigation bar.
4. Click **Choose File** (or Browse) and select the `database.sql` file located in your `skillgraph` folder.
5. Scroll down and click **Import** (or **Go**).
6. Verify that 9 tables are created:
   - `users`
   - `tracks`
   - `topics`
   - `tasks`
   - `user_task_progress`
   - `flashcards`
   - `user_flashcard_reviews`
   - `practice_problems`
   - `mistake_notes`

---

## 9. How to Configure Database Credentials in `db.php`

Open `db.php` in any text editor. The default settings match standard XAMPP configurations:

```php
$dbHost = '127.0.0.1';
$dbPort = '3306';
$dbName = 'skillgraph';
$dbUser = 'root';
$dbPass = ''; // Empty string is default for XAMPP
```

If your local MySQL uses a custom port or root password, update `$dbPort` or `$dbPass` accordingly.

---

## 10. How to Run the Project

1. Ensure the `skillgraph` folder is located inside XAMPP's `htdocs` directory:
   ```text
   C:\xampp\htdocs\skillgraph\
   ```
   *(If you are developing in another folder, you can create a directory junction pointing from `C:\xampp\htdocs\skillgraph` to your workspace folder).*
2. Open your web browser and navigate to:
   ```text
   http://localhost/skillgraph/
   ```
3. If not signed in, you will be directed to `login.html`.

---

## 11. How to Register a New User

1. Navigate to `http://localhost/skillgraph/register.html` (or click **Create an account** on the login page).
2. Enter your **Full Name** (e.g. `Sam Devaraja`).
3. Enter your **Email Address** (e.g. `sam@university.edu`).
4. Enter a **Password** (minimum 6 characters) and confirm it.
5. Click **Create Account**.
6. The system creates your record, generates a secure password hash, creates your session, and redirects you directly to the **Dashboard**.

---

## 12. How to Test Each Major Feature (College Project Review Walkthrough)

### Test 1: Demonstration Account Quick-Sign In
1. Open `http://localhost/skillgraph/login.html`.
2. Click the **Auto-fill Demo Account** button under the demo review box.
   - Credentials filled: `demo@skillgraph.local` / `password123`.
3. Click **Sign In**.
4. You will land on `index.html` with starter metrics already populated.

### Test 2: Permanent Dark Theme UI
1. Load any page in the platform (Dashboard, Roadmap, Flashcards, Practice, Mistakes, Progress, Login, Register).
2. The UI consistently renders the curated LeetCode-inspired Dark Theme (`#1A1A1A` background, `#222222` cards, `#F5F5F5` text, `#FFA116` accent) with zero flashing.

### Test 3: Learning Roadmap Checklist
1. Click **Learning Roadmap** (`roadmap.html`).
2. Scroll to any track (e.g., **Java Fundamentals** or **Two Pointers and Sliding Window**) and click to expand the accordion.
3. Check or uncheck a task checkbox (e.g., `Understand opposite-direction two pointer technique`).
4. Notice the task title crosses out with strikethrough, and the topic and track completion percentages recalculate automatically.
5. Click **Add Custom Topic** under a track to add your own topic (e.g. `Trie Trees`).
6. Notice the new topic appears with a purple `Custom` badge and has an **Edit** and **Delete** button, whereas core topics cannot be deleted.

### Test 4: Concept Revision Flashcards
1. Click **Flashcards** (`flashcards.html`).
2. Click on the 3D flashcard card face (or press `Spacebar`) to flip the card and reveal the answer.
3. Click **Next** (or press the Right Arrow key `&rarr;`) to navigate to the next card.
4. Click **Mark as Reviewed** to mark the card completed.
5. Test the **Category Filter** dropdown (e.g. select `Java` or `Algorithms`) to view topic-specific cards.
6. Click **Add Flashcard** to create a personal revision card.

### Test 5: Practice Hub Tracker
1. Click **Practice Hub** (`practice.html`).
2. Click any of the platform shortcut cards (**LeetCode**, **HackerRank**, **CodeChef**, **GeeksforGeeks**) to verify external links open safely in a new browser tab.
3. Click **Record Problem** to log a new problem:
   - Title: `Binary Tree Maximum Path Sum`
   - Platform: `LeetCode`
   - URL: `https://leetcode.com/problems/binary-tree-maximum-path-sum/`
   - Difficulty: `Hard`
   - Status: `Attempted`
4. Use the inline dropdown in the table to switch status from `Attempted` to `Solved`.
5. Test the **Difficulty Filter** dropdown to filter by `Hard` problems.

### Test 6: Mistake & Revision Journal
1. Click **Mistake Journal** (`mistakes.html`).
2. Review the structured mistake cards showing the red **What Went Wrong / Trap Encountered** block alongside the green **Correct Approach & Key Lesson** block.
3. Click **Mark Revised** on any pending note to mark it resolved.
4. Click **Log Mistake** to document a new coding edge-case error.
5. Use the keyword search box to search for `overflow` or `null pointer`.

### Test 7: Preparation Progress Analytics
1. Click **Progress Analytics** (`progress.html`).
2. Verify that task counts, problem difficulty counts, retention percentages, track progress bars, and the topic audit table match your active database records.
3. Notice that all statistics dynamically reflect your actual activity without hardcoded values.

### Test 8: Logout & Authorization Protection
1. Click **Sign Out** in the sidebar.
2. Try navigating directly to `http://localhost/skillgraph/index.html`.
3. The application intercepts the unauthenticated state and redirects you to `login.html`.

---

## 13. Known Limitations

- **Manual Recording:** In accordance with project requirements and competitive platform terms of service, problem submissions and practice records are recorded manually by the student rather than scraping private coding profile credentials.
- **Single Host / Local Environment:** Designed for local development under XAMPP on localhost. Deployment to multi-server production environments would require HTTPS and environment variable credential management.

---

## 14. Academic Demonstration Summary

| Evaluated Criteria | Implementation in SkillGraph |
| :--- | :--- |
| **Clean Architecture** | Separation of concerns: pure HTML/JS presentation, stateless JSON REST API in `api.php`, normalized MySQL schema in `database.sql`. |
| **Security Best Practices** | Bcrypt password hashing (`password_hash`), session regeneration, PDO prepared statements for 100% of SQL queries, CSRF validation tokens, and server-side record ownership checks. |
| **User Experience** | Instant responsive feedback via floating toasts, 3D flip card animations, zero intrusive browser alerts, and a permanent dark coding theme. |
| **Maintainability** | Compact 13-file codebase without framework overhead; easy for a student to trace, explain, and demonstrate during a viva or review. |

---

*SkillGraph — The Coding Learning & Practice Platform &copy; 2026. Designed for academic demonstration and placement preparation.*
#   S k i l l G r a p h  
 
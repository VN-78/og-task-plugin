 # Google Tasks for Obsidian

A clean, modern, and privacy-first Obsidian plugin that seamlessly connects your vault to **Google Tasks**. Manage your daily tasks from a mobile-style sidebar widget, or embed full-width desktop task tables directly into your notes with real-time search, filtering, and cloud synchronization.

---

## ✨ Features

- **📱 Mobile-Style Sidebar Widget**: Compact and lightweight task manager in the right sidebar—recreating the feel of the Google Tasks mobile widget with instant checkbox toggles, overdue alerts, and list switching.
- **💻 Desktop-Style Note Embeds**: Embed interactive, full-width task tables into any markdown note. Features real-time text search, quick filter tabs, and expandable task descriptions.
- **⚡ Zero-Friction Insertion**: Embed task tables effortlessly via **`Ctrl + P`**, the **`/` slash command**, or the **right-click editor menu**—no need to manually type code fences.
- **🎨 Clean, Seamless Design**: Neutralizes Obsidian's code block wrappers so embedded tables sit naturally in your notes with no double borders, gray frames, or overlapping outlines.
- **📂 Full Task List Management**: Switch between lists, create new lists, rename existing lists, or safely delete custom lists right from the interface.
- **🔄 Instant Client-Side Sorting**:
  - **My order**: Preserves your custom cloud sequence from Google Tasks.
  - **Date**: Sorts by due date ascending (earliest deadlines first, overdue highlighted, undated tasks at the bottom).
  - **Title**: Sorts alphabetically (A–Z).
- **🎯 Dynamic Filter Tabs**: Filter embedded tables by **All**, **Today**, **Upcoming**, **Overdue**, or **Completed**.
- **📅 Google Calendar Sync**: Setting a due date syncs directly to your Google Calendar as an all-day task deadline.
- **⌨️ Keyboard-Navigable Modal**: Create and edit task titles, multiline descriptions, and deadlines with full keyboard support (`Enter` to submit, `Esc` to cancel).
- **🛡️ 100% Private & Local**: Communicates directly with Google's API using Obsidian's secure `requestUrl`. Your tokens stay strictly on your local device in `data.json`. Zero telemetry, zero external servers.

---

## 🚀 Setup Guide: Google Cloud OAuth 2.0

Because Google Tasks contains personal data, Google requires OAuth 2.0 authentication. You will create your own free Google Cloud credentials in 5 minutes so you retain full control over your data.

### Step 1: Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Log in with your Google account.
3. Click the project dropdown at the top of the page and select **New Project**.
4. Name your project (e.g., `Obsidian Tasks`) and click **Create**.

### Step 2: Enable the Google Tasks API
1. In the sidebar, navigate to **APIs & Services → Library**.
2. Search for **Google Tasks API**.
3. Select it and click **Enable**.

### Step 3: Configure the OAuth Consent Screen
1. In the sidebar, navigate to **APIs & Services → OAuth consent screen**.
2. Select **External** as the user type and click **Create**.
3. Fill in the required fields:
   - **App name**: `Obsidian Google Tasks`
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
4. Click **Save and Continue**.
5. On the **Scopes** page, click **Add or Remove Scopes**:
   - Filter or scroll to find `.../auth/tasks` (*Create, edit, organize, and delete all your tasks*).
   - Check the box and click **Update**, then click **Save and Continue**.
6. On the **Test users** page:
   - Click **+ Add Users**.
   - Enter your Google account email address.
   - Click **Add**, then click **Save and Continue**.

### Step 4: Create OAuth 2.0 Client ID
1. In the sidebar, navigate to **APIs & Services → Credentials**.
2. Click **+ Create Credentials** at the top and choose **OAuth client ID**.
3. In the **Application type** dropdown, select **Web application** (or **Desktop app**):
   - Under **Authorized redirect URIs**, click **+ Add URI**.
   - Enter exactly:
     ```text
     http://127.0.0.1:42813
     ```
4. Click **Create**.
5. A dialog will appear displaying your **Client ID** and **Client Secret**. Copy both values.

### Step 5: Connect in Obsidian
1. Open Obsidian and go to **Settings → Community plugins → Google tasks**.
2. Paste your **Client ID** and **Client Secret**.
3. Click **Connect to Google tasks**:
   - A browser window will open asking you to sign in to Google and authorize your app.
   - If prompted with *"Google hasn't verified this app"*, click **Advanced** → **Go to Obsidian Google Tasks (unsafe)** (this warning appears because you are using your own private developer project).
   - Grant permission and click **Continue**.
4. You will see a success message in your browser. Close the tab and return to Obsidian—your account status will now show **Connected to Google tasks**!

---

## 📖 How to Use

### 1. The Sidebar Widget
- Click the **Check Square** icon in Obsidian's left ribbon (or run the command `Open Google tasks` via `Ctrl + P`).
- **Switch Lists**: Click the list name at the top left to open the dropdown menu. Select another list or click **+ New list** to create one.
- **List Options (`⋮`)**: Click the three dots icon to:
  - Sort tasks by **My order**, **Date**, or **Title**.
  - **Rename list**: Update the title of the active list.
  - **Delete list**: Delete custom lists (the default primary list cannot be deleted).
- **Create a Task**: Click the **+ Add task** button at the top right.
- **Edit a Task**: Click on any task title or hover and click the **✏️ Edit** button.
- **Delete a Task**: Hover over a task and click the **🗑️ Delete** button.
- **Completed Tasks**: Click the **Completed** collapsible section at the bottom to view recently completed items.

---

### 2. Embedding Task Tables in Notes

You can embed interactive task tables into your daily notes, project dashboards, or meeting notes using any of these methods:

#### Method A: Command Palette (`Ctrl + P`)
- Press `Ctrl + P` and search for:
  - **`Google Tasks: Insert task table`**: Inserts a table showing your active list.
  - **`Google Tasks: Insert task table from specific list...`**: Opens a fuzzy picker to choose which list to embed.

#### Method B: Slash Commands (`/`)
- On an empty line in any note, type `/task` or `/google` and press `Enter`.

#### Method C: Right-Click Context Menu
- Right-click anywhere in your note editor and select **Insert Google tasks table**.

#### Method D: Markdown Code Block
You can also manually write code blocks with custom parameters:

````markdown
```google-tasks
```
````

#### Advanced Codeblock Configuration:
````markdown
```google-tasks
list: Work
filter: today
search: urgent
title: High Priority Work Tasks
```
````

| Option | Type | Description |
| :--- | :--- | :--- |
| `list` | String | Name of the list to display (case-insensitive). Defaults to active list. |
| `filter` | String | Initial active tab: `all`, `today`, `upcoming`, `overdue`, or `completed`. |
| `search` | String | Real-time text query to filter matching tasks. |
| `title` | String | Custom title to display in the table header. |

---

### 3. Interactive Table Features
- **Filter Tabs**: Instantly switch between **All**, **Today**, **Upcoming**, **Overdue**, and **Completed** with zero network delay.
- **Search Bar**: Filter tasks on the fly by typing keywords matching task titles or notes.
- **Inline Details**: Tasks with descriptions show a **Details** button. Click it to expand and read notes directly inside the table row.
- **Optimistic Checkbox**: Clicking a checkbox strikes through the task immediately and syncs with Google Tasks in the background.

---

## 🔒 Security & Privacy

- **Direct Connections Only**: All network traffic occurs directly between Obsidian and Google's endpoints (`tasks.googleapis.com` and `oauth2.googleapis.com`) using Obsidian's native `requestUrl` API.
- **Local Storage**: Credentials and tokens are stored locally inside your vault at `.obsidian/plugins/og-task/data.json`.
- **Ephemeral Local Server**: The local authentication server runs on `http://127.0.0.1:42813` only for the duration of the OAuth sign-in and shuts down immediately upon receiving the authorization code (or after a 2-minute timeout).
- **Zero Third-Party Telemetry**: This plugin contains no analytics, no external tracking scripts, and no intermediary servers.

---

## 🛠️ Development

If you wish to build or modify the plugin locally:

```bash
# Clone the repository into your vault's plugin directory
cd <Vault>/.obsidian/plugins/og-task-plugin

# Install dependencies
npm install

# Build the plugin in watch mode for development
npm run dev

# Run production build (TypeScript + esbuild + Tailwind CSS)
npm run build

# Run linter
npm run lint
```

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

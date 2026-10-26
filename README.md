# Personal Calendar

A calendar I'm building for myself so I can be more productive. It puts everything I need to work on in one place: school assignments, things to do at home, and projects I want to make progress on.

**Live demo:** https://jaivalj.github.io/PersonalCalendar/
(On the demo, open **Integrations → Your data → Load sample data** to see it with some events in it.)

The design is modeled on [Notion Calendar](https://www.notion.so/product/calendar), because I like how clean it looks.

## Features

### Calendar (main tab)
- Day, week, and month views, plus a mini calendar and a show/hide filter per subject in the sidebar.
- Click a time slot to add an event, or click and drag across slots to pick a time range, like Notion Calendar.
- Each event has a title, subject, start and end time, an all-day option, a location, a short description, and a reminder.
- Drag events to move them to a new time or day.

### Subjects (second tab)
- Add, rename, delete, and change the color of subjects.
- Every subject is a dropdown list of its events.
- Drag an event from one subject onto another to move it.

### Integrations
- **Google Calendar** and **Google Classroom**: imports calendar events and assignment due dates.
- **Canvas**: imports assignments, quizzes, and events from the Canvas planner.
- **Notion**: imports dated pages from Notion databases.
- Imported items are filed under a subject named after their course automatically (this can be turned off).

### Notifications
- Reminders before an event starts, with a default lead time and a per-event override.
- The app can also be installed (PWA) from the browser.

### Look and feel
- Dark and light mode, with a toggle at the bottom left of the sidebar.

## Running it locally

You need [Node.js](https://nodejs.org/) 18 or newer. There are no dependencies to install.

```
node server.js
```

Then open http://localhost:5173.

Don't open `index.html` directly from the file system. Google sign-in, notifications, and the Notion integration need the server.

## Setting up the integrations

All credentials are stored only in your own browser (local storage) and are never sent anywhere except to the service they belong to. Each card in the **Integrations** tab has step-by-step instructions. In short:

| Integration | What you need |
| --- | --- |
| Google Calendar / Classroom | A Google OAuth Client ID (Web application) with the Calendar and Classroom APIs enabled. Add your app's address (for example `http://localhost:5173`) under "Authorized JavaScript origins". Access is read-only. |
| Canvas | Your school's Canvas URL and a personal access token (Account → Settings → New Access Token). |
| Notion | An internal integration token, with your database shared with that integration. The database needs a Date property. A select property named "Subject", "Course", or "Class" is used to pick the subject. |

## Good to know

- **Reminders only fire while the app is open** in a browser tab or as an installed app. A closed app can't send notifications without a server pushing them to it.
- **Notion (and sometimes Canvas) need `node server.js`.** Their APIs block requests made directly from a web page, so the included server acts as a small proxy. On the GitHub Pages demo, Google Calendar/Classroom, subjects, and reminders work, but Notion and Canvas will show an error explaining this.
- **Data stays in your browser.** Events and subjects are saved per browser and per web address, so the demo site and `localhost` each have their own data.

## Project files

| File | What it does |
| --- | --- |
| `index.html` | Page structure |
| `style.css` | All styling, including the dark and light themes |
| `script.js` | The app: calendar views, event editor, Subjects tab, reminders, and sync |
| `integrations.js` | Google, Canvas, and Notion API code |
| `server.js` | Small local server that serves the app and proxies Notion/Canvas |
| `sw.js`, `manifest.webmanifest`, `icon.svg` | Service worker, notifications, and install support |

## About this project and how I built it

I forgot to write about this project last week, so this covers a lot of updates at once:

- I completely revamped the UI of the calendar.
- I added integrations for Google Calendar, Google Classroom, Canvas, and Notion.
- I added a main page where you can see the calendar and add events directly.
- I added a second tab called Subjects, where you can color code and group events and move them from group to group.
- I added notifications, and a dark and light mode toggle.

**The hardest part was getting the integrations to work**, especially Canvas and Notion. I had never connected to outside services before, so it was all new to me and took a lot of time. I also spent a lot of time on the design, figuring out where the tabs should go and how everything should be laid out.

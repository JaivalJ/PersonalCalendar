# PersonalCalendar

**Live demo:** https://jaivalj.github.io/PersonalCalendar/

Hi, I'm a high school student, and this is a calendar I coded myself with plain HTML, CSS, and JavaScript. No frameworks. I wanted one place to keep track of my life instead of five different apps.

## What I built

- A month view calendar with a 7-column grid, with today highlighted
- Previous / next month buttons and a "Today" button to jump back
- Click any day to select it and see that day's events
- Add and delete events for a day, with a little dot on days that have something planned
- Events are saved in my browser (`localStorage`), so they're still there after a refresh
- Works on a phone-sized screen too

## What broke

- **Month grid:** My first version had the days starting on the wrong weekday. I had to learn how `Date.getDay()` works and pad the grid with days from the previous month.
- **Dates and time zones:** Saving dates in a weird format made events show up on the wrong day. Using a simple `YYYY-MM-DD` key fixed it.
- **Clicking faded days:** Clicking a gray day from another month selected it but left the view on the old month, which was confusing. Now it jumps to that month.
- **Saving only works on one device:** Since data lives in `localStorage`, it doesn't follow me from my laptop to my phone. I haven't fixed this yet.

## What's next

- **Track assignments for my classes**, with due dates, so I can see homework and tests on the calendar
- **Personal projects** I want to work on, with goals and steps
- **Tasks around the house**, like chores and things I have to do at home
- **Connect it to Google Classroom** so my assignments show up automatically (and eventually Google Calendar too)
- Real accounts or cloud saving so my events work on every device

## Run it yourself

Download the files and open `index.html` in a browser.

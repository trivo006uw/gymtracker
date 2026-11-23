# GymTracker

A cyberpunk gym tracker built with Expo. Log workouts, follow a weekly routine, and see how much stronger you are than when you started.

All data stays on your device. There is no server to keep running.

## Use it on your iPhone (free, no Apple developer fee)

The live web app is here:

**https://trivo006uw.github.io/gymtracker/**

1. Open that link in **Safari** (not Chrome or in-app browsers).
2. Tap the **Share** button.
3. Tap **Add to Home Screen**, then Add.
4. Open **GymTracker** from your home screen. It runs full screen like a normal app.

Your workouts, routines, and weekly plan are saved in the browser on this phone. If you clear Safari data for the site, that data is gone, so use **Export backup** on the dashboard now and then. **Import backup** restores a saved file.

Updates go live at the same link when this repo is rebuilt. After an update, close the home-screen app and open it again.

### Limits to know

- This is a home-screen web app, not an App Store build. It will not appear in the App Store, and iOS may still treat it as a website in some system menus.
- On iPhone, Export may open the share sheet or download a file to the Files app, depending on the iOS version.
- Data does not sync between phones. Export on one device and import on the other to copy it across.

## Run locally (Expo)

```bash
npm install
npx expo start
```

Then open it in Expo Go, or press `w` for the web version.

To build the static GitHub Pages site:

```bash
npm run export:web
```

The site is written to `dist/`, with `/gymtracker/` as its base path.

## Data

Everything is stored on the device with AsyncStorage under:

- `@gymtracker_workouts`
- `@gymtracker_routines`
- `@gymtracker_schedule`

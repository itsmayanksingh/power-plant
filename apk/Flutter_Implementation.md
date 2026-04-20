# Plant-Based Monitoring System
## Mobile Flutter APK & iOS Implementation Guide

Version: 1.0  
Prepared for: Flutter Mobile App Implementation  
Recommended stack: Flutter + Cubit/BLoC + Dio + Flutter Secure Storage + Hive + Connectivity Plus + Geolocator + go_router + Freezed + json_serializable + BotToast

---

## 1. Purpose of this guide

This guide explains how to implement the **Flutter mobile application** for the Plant-Based Monitoring System from zero to production-ready structure for both **Android APK/AAB** and **iOS IPA**.

This implementation expands the source technical document and focuses on the mobile side:
- app bootstrap flow
- module-by-module implementation
- which mobile part consumes which backend API
- clean white background and black text UI rules
- responsive layout for phones and tablets
- pop messages for create, update, sync, and profile actions
- try/catch based error handling in every important layer
- offline storage and auto-sync flow
- Android and iOS release process

---

## 2. Mobile app goals

The mobile app is designed mainly for **employees** who work at assigned plant sites.

The app should allow an employee to:
1. log in securely
2. stay signed in with token persistence
3. mark GPS-based attendance check-in and check-out
4. view assigned site details and parameter list
5. submit daily plant readings through a dynamic form
6. work offline and sync later
7. view submission history
8. update own profile basics and change password
9. receive reminders and status messages
10. run smoothly on Android and iOS

---

## 3. UI design rules requested for this implementation

Use these UI rules across the complete mobile application:
- background: white
- text color: black
- card background: white
- page surface: white
- borders: light gray
- headings: black and bold
- secondary text: dark gray
- icons: black by default
- error state: red accent only where needed
- success state: green accent only where needed
- warning state: amber accent only where needed

Recommended Flutter theme direction:
- `scaffoldBackgroundColor: Colors.white`
- `cardColor: Colors.white`
- `textTheme` uses near-black colors
- primary text always readable on white
- app bars white with dark icons and dark text
- forms use black labels and gray borders

---

## 4. Recommended Flutter stack

The source technical document already aligns well with these libraries:

### Core libraries
- `flutter_bloc` or `bloc`
- `dio`
- `flutter_secure_storage`
- `hive` + `hive_flutter`
- `geolocator`
- `connectivity_plus`
- `go_router`
- `freezed`
- `json_serializable`
- `intl`
- `cached_network_image`
- `flutter_local_notifications`

### Additional libraries to improve implementation
- `bot_toast` for global pop messages after actions
- `equatable` for simple state comparisons when needed
- `logger` for local development logging
- `permission_handler` for permission handling
- `package_info_plus` for app version visibility

### Why BotToast
BotToast is a good fit here because it can show:
- success popup after submission
- sync success popup
- check-in/check-out confirmation
- profile updated confirmation
- readable error popup from failed requests

### Suggested package install
```bash
flutter pub add flutter_bloc dio flutter_secure_storage hive hive_flutter geolocator connectivity_plus go_router freezed_annotation json_annotation intl cached_network_image flutter_local_notifications bot_toast permission_handler logger package_info_plus
flutter pub add --dev build_runner freezed json_serializable hive_generator
```

---

## 5. End-to-end mobile flow

```text
App Launch
-> App bootstrap
-> Local token check
-> If token missing -> Login Screen
-> If token exists -> Validate session -> Home Shell

Home Shell
-> Attendance tab
-> My Site tab
-> My Submissions tab
-> Profile tab

Attendance tab
-> Check permission
-> Get GPS
-> Call attendance API
-> Show success/error popup

My Site tab
-> Load assigned site
-> Load parameter definitions
-> Show Submit Today's Data button

Dynamic Form
-> Build fields from parameter definitions
-> Validate values
-> If online -> submit immediately
-> If offline -> store locally -> mark pending sync

Sync Engine
-> Detect internet restore
-> Read pending local records
-> Push to API one by one
-> Update local status
-> Show popup + refresh history

Profile tab
-> Load user profile
-> Update profile
-> Change password
-> Logout
```

---

## 6. Recommended Flutter architecture

Use a **feature-first layered architecture**.

### Layer 1: Presentation
Contains:
- screens
- widgets
- forms
- tabs
- dialogs
- loaders
- error states

### Layer 2: State management
Contains:
- Cubits / Blocs
- state classes
- UI event handling
- loading/success/error transitions

### Layer 3: Domain / repository contracts
Contains:
- repository interfaces
- entities/models if you separate clean architecture style
- business rules

### Layer 4: Data layer
Contains:
- remote data source with Dio
- local data source with Hive / Secure Storage
- DTO / model mapping
- response parsing

### Layer 5: Core / shared
Contains:
- network interceptors
- route guards
- constants
- theme
- toast helper
- exception classes
- connectivity helper
- validators

This structure is easier for both developers and AI coding tools.

---

## 7. Recommended project folder structure

```text
lib/
├── main.dart
├── app.dart
├── bootstrap.dart
├── core/
│   ├── constants/
│   │   ├── api_constants.dart
│   │   ├── app_sizes.dart
│   │   └── hive_boxes.dart
│   ├── network/
│   │   ├── dio_client.dart
│   │   ├── dio_interceptors.dart
│   │   └── api_exception.dart
│   ├── storage/
│   │   ├── secure_storage_service.dart
│   │   └── hive_service.dart
│   ├── services/
│   │   ├── connectivity_service.dart
│   │   ├── location_service.dart
│   │   ├── toast_service.dart
│   │   └── notification_service.dart
│   ├── theme/
│   │   ├── app_colors.dart
│   │   ├── app_theme.dart
│   │   └── text_styles.dart
│   ├── routing/
│   │   ├── app_router.dart
│   │   └── route_guards.dart
│   ├── utils/
│   │   ├── validators.dart
│   │   ├── error_mapper.dart
│   │   ├── date_formatter.dart
│   │   └── responsive_helper.dart
│   └── widgets/
│       ├── app_button.dart
│       ├── app_text_field.dart
│       ├── app_loader.dart
│       ├── app_error_state.dart
│       └── empty_state.dart
├── features/
│   ├── splash/
│   ├── auth/
│   ├── attendance/
│   ├── site/
│   ├── submission/
│   ├── sync/
│   ├── notifications/
│   └── profile/
└── shared/
    ├── models/
    ├── enums/
    └── widgets/
```

---

## 8. Which mobile part consumes which backend part

| Mobile module | Screen / action | State / logic part | Backend endpoint consumed |
|---|---|---|---|
| Splash / Bootstrap | token check | `BootstrapCubit` | local storage first, then optional `GET /users/me` |
| Auth | login | `AuthCubit` | `POST /api/v1/auth/login` |
| Auth | refresh session | interceptor / auth repo | `POST /api/v1/auth/refresh` |
| Auth | logout | `AuthCubit` | `POST /api/v1/auth/logout` |
| Profile | load self | `ProfileCubit` | `GET /api/v1/users/me` |
| Profile | update self | `ProfileCubit` | `PUT /api/v1/users/me` |
| Profile | change password | `ChangePasswordCubit` | `POST /api/v1/auth/change-password` |
| Attendance | check-in | `AttendanceCubit` | `POST /api/v1/attendance/check-in` |
| Attendance | check-out | `AttendanceCubit` | `POST /api/v1/attendance/check-out` |
| Attendance | my history | `AttendanceHistoryCubit` | `GET /api/v1/attendance/my` |
| Site | assigned site load | `MySiteCubit` | `GET /api/v1/sites/my-site` |
| Submission | create submission | `SubmissionCubit` | `POST /api/v1/submissions` |
| Submission | my history | `SubmissionHistoryCubit` | `GET /api/v1/submissions?userId=me` |
| Submission | single submission detail | `SubmissionDetailCubit` | `GET /api/v1/submissions/:id` |
| Sync | resend pending records | `SyncCubit` | `POST /api/v1/submissions` |
| Notifications | reminders and local alerts | local notifications service | local scheduling or future notification API |

This mapping should be kept visible inside the repo in a developer README.

---

## 9. Bootstrap flow design

### 9.1 What happens in `main.dart`
Responsibilities:
- initialize Flutter binding
- initialize Hive
- initialize BotToast
- initialize local notifications
- initialize secure storage helpers
- initialize repositories and cubits
- run app

### 9.2 What happens in `app.dart`
Responsibilities:
- create `MaterialApp.router`
- apply white background and black text theme
- register `BotToastInit()`
- attach router
- apply navigation observers if needed

### 9.3 What happens in Splash / Bootstrap module
Responsibilities:
- check access token
- check refresh token if used
- optionally fetch current profile
- decide route:
  - login
  - home shell
  - forced re-login

### Suggested bootstrap rule
Keep bootstrap fast:
- no heavy data fetch
- only validate session basics
- load real page data after shell enters

---

## 10. Theme and responsive design

### 10.1 White background and black text theme
Use a clean enterprise theme:

```dart
class AppColors {
  static const background = Colors.white;
  static const surface = Colors.white;
  static const textPrimary = Color(0xFF111111);
  static const textSecondary = Color(0xFF4B5563);
  static const border = Color(0xFFE5E7EB);
  static const success = Color(0xFF16A34A);
  static const error = Color(0xFFDC2626);
  static const warning = Color(0xFFD97706);
}
```

### 10.2 Responsive rules
The app must be responsive for:
- small Android phones
- large Android phones
- tablets
- iPhones
- iPads

Recommended rules:
- use `LayoutBuilder` for width-based decisions
- use `MediaQuery` only where needed
- use scroll-safe forms
- keep bottom nav on phones
- consider `NavigationRail` on tablets
- limit form width on large screens
- use `Wrap` / `GridView` for cards on wide screens
- avoid hardcoded widths

### 10.3 Helper example
```dart
class ResponsiveHelper {
  static bool isTablet(BuildContext context) =>
      MediaQuery.of(context).size.width >= 768;

  static double formMaxWidth(BuildContext context) =>
      isTablet(context) ? 640 : double.infinity;
}
```

---

## 11. Global pop message strategy

Use **BotToast** for action feedback.

### Show success pop message when:
- login successful
- attendance check-in complete
- attendance check-out complete
- profile updated
- submission saved
- submission synced
- password changed
- logout complete

### Show error pop message when:
- login failed
- GPS permission denied
- network request failed
- validation failed from server
- sync failed
- token expired
- profile update failed

### Toast service wrapper
```dart
class ToastService {
  static void showSuccess(String message) {
    BotToast.showText(text: message);
  }

  static void showError(String message) {
    BotToast.showText(text: message);
  }
}
```

Do not call BotToast directly everywhere. Wrap it in a service so the code stays consistent.

---

## 12. Global error handling approach

Use try/catch in every important layer, but do not duplicate logic blindly.

### Where try/catch should exist
- Dio remote data source methods
- repository methods when combining local + remote logic
- Cubit submit/load methods
- UI submit handlers when awaiting direct async actions
- local sync worker
- permission and location fetch actions

### Example error flow
```text
API request fails
-> Dio throws exception
-> remote data source maps to ApiException
-> repository returns clean failure
-> cubit emits error state
-> UI listens to state
-> BotToast shows readable message
```

### ApiException model
```dart
class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException({required this.message, this.statusCode});
}
```

---

## 13. Dio client design

### Responsibilities
- base URL
- timeouts
- auth token injection
- refresh token logic
- request logging in debug
- unified response parsing

### Recommended interceptor behavior
1. Add bearer token
2. If 401:
   - attempt refresh once
   - retry original request
3. If refresh fails:
   - clear tokens
   - redirect to login
   - show session expired popup

### Sample pattern
```dart
class DioClient {
  final Dio dio;

  DioClient(this.dio);

  Future<Response<T>> get<T>(String path, {Map<String, dynamic>? query}) async {
    try {
      return await dio.get<T>(path, queryParameters: query);
    } on DioException catch (e) {
      throw ApiException(
        message: e.response?.data?['message'] ?? 'Request failed',
        statusCode: e.response?.statusCode,
      );
    } catch (_) {
      throw ApiException(message: 'Unexpected error occurred');
    }
  }
}
```

---

## 14. Auth module design

### Screens
- SplashScreen
- LoginScreen

### State parts
- `AuthCubit`
- `AuthState`
- `BootstrapCubit`

### Data parts
- `AuthRemoteDataSource`
- `AuthRepository`
- secure storage token service

### What Auth module consumes
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/users/me`

### Login screen responsibilities
- email field
- password field
- validation
- loading button state
- login submit
- success navigation
- error popup

### Login submit pattern
```dart
Future<void> login() async {
  try {
    emit(state.copyWith(status: AuthStatus.loading));
    final result = await repository.login(
      email: state.email,
      password: state.password,
    );
    emit(state.copyWith(status: AuthStatus.success, user: result.user));
    ToastService.showSuccess('Login successful');
  } on ApiException catch (e) {
    emit(state.copyWith(status: AuthStatus.failure, errorMessage: e.message));
    ToastService.showError(e.message);
  } catch (_) {
    emit(state.copyWith(
      status: AuthStatus.failure,
      errorMessage: 'Unexpected login error',
    ));
    ToastService.showError('Unexpected login error');
  }
}
```

---

## 15. Home shell design

Use a shell route with bottom navigation.

### Tabs
- Attendance
- My Site
- My Submissions
- Profile

### Responsibilities
- hold bottom navigation state
- preserve tab states if possible
- support deep navigation into submission detail or form screen

### Tablet recommendation
On tablets, consider switching from bottom nav to `NavigationRail`.

---

## 16. Attendance module design

### Screens
- AttendanceScreen
- AttendanceHistoryScreen

### Consumed backend
- `POST /api/v1/attendance/check-in`
- `POST /api/v1/attendance/check-out`
- `GET /api/v1/attendance/my`

### Data flow
```text
User taps Check In
-> request permission
-> get GPS coordinates
-> send latitude and longitude
-> backend stores attendance
-> cubit emits success
-> popup shows success
-> UI refreshes today's status
```

### Important implementation notes
- disable button while request is in progress
- handle permission denied
- handle location disabled
- prevent duplicate check-in taps
- store last action locally if needed for recovery

### Cubit method example
```dart
Future<void> checkIn() async {
  try {
    emit(state.copyWith(isSubmitting: true));

    final position = await locationService.getCurrentPosition();
    await repository.checkIn(
      lat: position.latitude,
      lng: position.longitude,
    );

    emit(state.copyWith(isSubmitting: false, checkedIn: true));
    ToastService.showSuccess('Attendance marked successfully');
  } on ApiException catch (e) {
    emit(state.copyWith(isSubmitting: false, errorMessage: e.message));
    ToastService.showError(e.message);
  } catch (_) {
    emit(state.copyWith(
      isSubmitting: false,
      errorMessage: 'Unable to mark attendance',
    ));
    ToastService.showError('Unable to mark attendance');
  }
}
```

---

## 17. My Site module design

### Screen
- MySiteScreen

### Consumed backend
- `GET /api/v1/sites/my-site`

### Responsibilities
- show site name
- show location
- show description
- show active parameters
- show today's submission status
- open dynamic form

### UI blocks
- site summary card
- parameter list section
- submission status card
- action button to submit data

### Data caching
- cache site parameters in Hive
- if offline, show cached parameter list
- show offline banner if data is from local cache

---

## 18. Dynamic form module design

This is the most important mobile screen.

### Screen
- DynamicFormScreen

### Consumed backend
- site parameters from `GET /api/v1/sites/my-site`
- create submission via `POST /api/v1/submissions`

### Dynamic field mapping
- number -> `TextFormField` numeric keyboard
- text -> multiline or single line `TextFormField`
- dropdown -> `DropdownButtonFormField`
- boolean -> `SwitchListTile` or checkbox tile
- date -> date picker input

### Form structure
- site header
- parameter fields
- notes field
- submit button
- save offline status indicator

### Validation rules
- required check
- numeric parse check
- min / max check
- dropdown option check
- valid date check

### Submission flow
```text
Open form
-> render fields from parameter list
-> user enters values
-> validate all required fields
-> if online -> submit API
-> if offline -> save Hive record as pending_sync
-> show popup
-> navigate to history or success state
```

### Submit method example
```dart
Future<void> submitForm(SubmissionPayload payload) async {
  try {
    emit(state.copyWith(status: SubmissionStatus.submitting));

    final isOnline = await connectivityService.isOnline();
    if (!isOnline) {
      await repository.savePendingSubmission(payload);
      emit(state.copyWith(status: SubmissionStatus.savedOffline));
      ToastService.showSuccess('Saved offline. Will sync automatically.');
      return;
    }

    await repository.submit(payload);
    emit(state.copyWith(status: SubmissionStatus.success));
    ToastService.showSuccess('Submission completed successfully');
  } on ApiException catch (e) {
    emit(state.copyWith(status: SubmissionStatus.failure, error: e.message));
    ToastService.showError(e.message);
  } catch (_) {
    emit(state.copyWith(
      status: SubmissionStatus.failure,
      error: 'Unexpected submission error',
    ));
    ToastService.showError('Unexpected submission error');
  }
}
```

---

## 19. Submission history module design

### Screens
- SubmissionHistoryScreen
- SubmissionDetailScreen

### Consumed backend
- `GET /api/v1/submissions?userId=me`
- `GET /api/v1/submissions/:id`

### Responsibilities
- list past submissions
- filter by date range
- show local pending records
- show sync status
- open detail page
- support pull-to-refresh

### Status display
Use clear badges:
- Submitted
- Pending Review
- Approved
- Rejected
- Pending Sync
- Sync Failed

---

## 20. Offline sync module design

### Why this module matters
The technical document clearly expects offline mode. This module should be treated as a first-class feature.

### Data storage rules
Store these locally:
- cached site data
- cached profile basics
- pending submissions
- sync attempt metadata
- local status for pending / synced / failed

### Hive boxes
- `site_cache`
- `profile_cache`
- `pending_submissions`
- `sync_logs`

### Sync worker flow
```text
App detects connectivity restored
-> read pending submissions from Hive
-> process one by one
-> call submission API
-> if success, mark as synced
-> if fail, keep pending or mark failed
-> show compact popup
-> refresh history screen state
```

### Duplicate prevention
Use a local unique key:
- `userId + siteId + submissionDate`

### Retry rules
- retry automatically on reconnection
- allow manual retry from Pending Sync screen
- stop infinite retry loops after a defined threshold

---

## 21. Notifications module design

### Local notifications use cases
- remind user to check in
- remind user to submit daily plant data
- remind user to check out
- remind user when pending sync exists

### Suggested screen
- NotificationsScreen
- NotificationPreferencesScreen

This can start simple with local notifications and later expand to server-driven notifications.

---

## 22. Profile module design

### Screens
- ProfileScreen
- EditProfileScreen
- ChangePasswordScreen

### Consumed backend
- `GET /api/v1/users/me`
- `PUT /api/v1/users/me`
- `POST /api/v1/auth/change-password`
- `POST /api/v1/auth/logout`

### Responsibilities
- show user details
- show site assignment
- update profile fields that are editable
- change password
- logout

### Profile update pattern
```dart
Future<void> updateProfile(ProfileUpdateInput input) async {
  try {
    emit(state.copyWith(status: ProfileStatus.saving));
    final user = await repository.updateProfile(input);
    emit(state.copyWith(status: ProfileStatus.success, user: user));
    ToastService.showSuccess('Profile updated successfully');
  } on ApiException catch (e) {
    emit(state.copyWith(status: ProfileStatus.failure, error: e.message));
    ToastService.showError(e.message);
  } catch (_) {
    emit(state.copyWith(
      status: ProfileStatus.failure,
      error: 'Profile update failed',
    ));
    ToastService.showError('Profile update failed');
  }
}
```

---

## 23. Route design with go_router

### Public routes
- `/splash`
- `/login`

### Protected routes
- `/home`
- `/attendance`
- `/my-site`
- `/my-submissions`
- `/my-submissions/:id`
- `/submit`
- `/profile`
- `/profile/edit`
- `/profile/change-password`
- `/pending-sync`

### Guard rules
- if token missing -> send to login
- if token expired and refresh fails -> send to login
- if user not assigned site -> show safe empty state

---

## 24. Reusable widgets to build early

Build these shared widgets first:
- AppScaffold
- AppAppBar
- AppPrimaryButton
- AppSecondaryButton
- AppTextField
- AppDropdownField
- AppDateField
- AppSectionCard
- StatusBadge
- AppLoader
- AppEmptyState
- AppErrorState
- OfflineBanner
- SyncStatusTile

These speed up all modules and keep the UI consistent.

---

## 25. Recommended implementation sequence

### Phase 1
- project setup
- theme
- routing
- secure storage
- Dio client
- BotToast integration
- bootstrap flow

### Phase 2
- auth module
- login screen
- token persistence
- logout flow

### Phase 3
- attendance module
- permission handling
- GPS service
- attendance history

### Phase 4
- my site module
- parameter model parsing
- cached site details

### Phase 5
- dynamic form module
- field renderer
- validations
- online submission

### Phase 6
- offline storage
- pending sync queue
- auto-sync worker
- manual retry UI

### Phase 7
- submission history
- submission detail
- status badges

### Phase 8
- profile module
- change password
- notification reminders
- tablet responsiveness polish

### Phase 9
- Android release build
- iOS release build
- QA pass
- crash handling and analytics

---

## 26. Android APK / AAB release flow

### For Android
1. update app name, package id, version
2. configure release keystore
3. configure internet, location, and notification permissions
4. test on Android 10+
5. build release

```bash
flutter build apk --release
flutter build appbundle --release
```

### Android checks
- token persistence works
- GPS permission flow works
- offline sync works
- background resume does not break session
- toast messages visible
- release signing valid

---

## 27. iOS IPA release flow

### For iOS
1. update bundle id
2. set signing team in Xcode
3. add location permission description
4. add notification permission description
5. test on iPhone and iPad
6. archive release in Xcode or build with Flutter

```bash
flutter build ios --release
```

### iOS checks
- permission messages are clear
- navigation safe area looks correct
- keyboard overlap is handled
- dynamic form works on smaller iPhones
- bot toast and dialogs do not break safe areas

---

## 28. Testing checklist

### Functional tests
- login success and failure
- token refresh
- logout
- check-in
- check-out
- my-site load
- dynamic form rendering with all parameter types
- online submission
- offline submission save
- auto-sync
- profile update
- change password

### UI tests
- black text readable on white background
- no text overflow
- forms scroll properly
- buttons disabled during loading
- pop messages visible and readable
- tablet layout not stretched awkwardly

### Error tests
- no internet
- 401 token expired
- 500 backend failure
- GPS denied
- location service turned off
- invalid payload returned from API

---

## 29. Codex / AI prompt for full mobile implementation

```text
Build a production-grade Flutter mobile app for a Plant-Based Monitoring System.

Requirements:
- Flutter app for Android and iOS.
- Main user role: employee.
- Use flutter_bloc or Cubit, Dio, Flutter Secure Storage, Hive, Connectivity Plus, Geolocator, go_router, Freezed, json_serializable, BotToast, and flutter_local_notifications.
- UI theme must use white background and black text.
- App must be responsive for phone and tablet.
- App flow: splash -> auth check -> login or home shell.
- Home shell tabs: Attendance, My Site, My Submissions, Profile.
- Attendance screen must support GPS-based check-in and check-out.
- My Site screen must load assigned site and parameter definitions.
- Dynamic Form screen must generate fields from parameter metadata with number, text, dropdown, boolean, and date support.
- Submission flow must support online submit and offline save with Hive.
- Build auto-sync on connectivity restore.
- Show popup messages using BotToast after success and error actions.
- Use try/catch in data source, repository, cubit, and async UI handlers.
- Add profile update, change password, logout, submission history, submission detail, pending sync queue, and local notifications.
- Return clean folder structure, models, repositories, cubits, screens, reusable widgets, route setup, theme, Dio client, interceptors, and sample code.
```

---

## 30. Final recommendation

For this project, the best practical mobile implementation order is:
1. bootstrap
2. auth
3. attendance
4. my site
5. dynamic form
6. submission history
7. offline sync
8. profile
9. notifications
10. release build and QA

This order matches the actual business flow and reduces rework.

---

## 31. Conclusion

The strongest core of the mobile application is the **dynamic parameter-driven submission system** with **offline sync**. If the app is built with a clean service layer, Cubit state control, BotToast feedback, and disciplined try/catch handling, it can scale well for real field operations on both Android and iOS.

This guide is designed so that a developer, Codex, or another AI assistant can implement the app module by module without confusion.

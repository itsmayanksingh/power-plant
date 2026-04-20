import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/login_screen.dart';
import '../../features/home/home_shell.dart';
import '../../features/logs/logs_screen.dart';
import '../../features/notifications/notifications_screen.dart';
import '../../features/profile/change_password_screen.dart';
import '../../features/profile/edit_profile_screen.dart';
import '../../features/splash/splash_screen.dart';
import '../../features/submission/submission_detail_screen.dart';
import '../../features/submission/submission_form_screen.dart';
import '../../features/submission/submission_list_screen.dart';
import '../../features/sync/sync_screen.dart';
import '../state/session_controller.dart';

class AppRouter {
  AppRouter._();

  static final GoRouter router = GoRouter(
    initialLocation: '/splash',
    refreshListenable: SessionController.instance,
    routes: <RouteBase>[
      GoRoute(path: '/splash', builder: (context, state) => const SplashScreen()),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/home', builder: (context, state) => const HomeShell()),
      GoRoute(path: '/submissions', builder: (context, state) => const SubmissionListScreen()),
      GoRoute(
        path: '/submissions/:id',
        builder: (context, state) => SubmissionDetailScreen(id: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/submit',
        builder: (context, state) => SubmissionFormScreen(site: state.extra as dynamic),
      ),
      GoRoute(path: '/profile/edit', builder: (context, state) => const EditProfileScreen()),
      GoRoute(
        path: '/profile/change-password',
        builder: (context, state) => const ChangePasswordScreen(),
      ),
      GoRoute(path: '/logs', builder: (context, state) => const LogsScreen()),
      GoRoute(path: '/notifications', builder: (context, state) => const NotificationsScreen()),
      GoRoute(path: '/sync', builder: (context, state) => const SyncScreen()),
    ],
    redirect: (BuildContext context, GoRouterState state) {
      final isAuth = SessionController.instance.isAuthenticated;
      final path = state.fullPath ?? state.path;
      final isPublic = path == '/login' || path == '/splash';
      if (!isAuth && !isPublic) return '/login';
      if (isAuth && (path == '/login' || path == '/splash')) return '/home';
      return null;
    },
  );
}


import 'package:bot_toast/bot_toast.dart';
import 'package:flutter/material.dart';

import 'core/routing/app_router.dart';
import 'core/theme/app_theme.dart';

class PlantMonitoringApp extends StatelessWidget {
  const PlantMonitoringApp({super.key});

  @override
  Widget build(BuildContext context) {
    final router = AppRouter.router;
    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'Plant Monitoring',
      theme: AppTheme.theme,
      builder: BotToastInit(),
      routerConfig: router,
    );
  }
}


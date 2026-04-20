import 'package:bot_toast/bot_toast.dart';
import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

class ToastService {
  ToastService._();

  static void success(String message) {
    BotToast.showText(
      text: message,
      contentColor: AppColors.success,
      textStyle: const TextStyle(color: Colors.white),
    );
  }

  static void error(String message) {
    BotToast.showText(
      text: message,
      contentColor: AppColors.error,
      textStyle: const TextStyle(color: Colors.white),
    );
  }

  static void info(String message) {
    BotToast.showText(
      text: message,
      contentColor: AppColors.secondary,
      textStyle: const TextStyle(color: Colors.white),
    );
  }
}


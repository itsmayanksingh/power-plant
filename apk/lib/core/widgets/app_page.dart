import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import 'app_back_button.dart';

class AppPage extends StatelessWidget {
  const AppPage({
    required this.title,
    required this.child,
    super.key,
    this.actions,
    this.showBackButton = true,
    this.padding = const EdgeInsets.all(16),
  });

  final String title;
  final Widget child;
  final List<Widget>? actions;
  final bool showBackButton;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: showBackButton ? const AppBackButton() : null,
        title: Text(title),
        actions: actions,
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: <Color>[Color(0xFFF8FAFC), Color(0xFFFFFFFF)],
          ),
        ),
        child: Padding(
          padding: padding,
          child: DefaultTextStyle.merge(
            style: const TextStyle(color: AppColors.textPrimary),
            child: child,
          ),
        ),
      ),
    );
  }
}


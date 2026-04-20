import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

class StatusChip extends StatelessWidget {
  const StatusChip({required this.status, super.key});

  final String status;

  @override
  Widget build(BuildContext context) {
    final lower = status.toLowerCase();
    Color color = AppColors.secondary;
    if (lower.contains('approved') || lower.contains('active') || lower.contains('sync')) {
      color = AppColors.success;
    } else if (lower.contains('reject') || lower.contains('error') || lower.contains('failed')) {
      color = AppColors.error;
    } else if (lower.contains('pending')) {
      color = AppColors.warning;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Text(
        status,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

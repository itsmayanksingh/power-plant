import 'package:flutter/material.dart';

import '../../core/logs/app_log_store.dart';
import '../../core/utils/app_date_formatter.dart';
import '../../core/widgets/app_page.dart';

class LogsScreen extends StatelessWidget {
  const LogsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppPage(
      title: 'Error & Event Logs',
      child: AnimatedBuilder(
        animation: AppLogStore.instance,
        builder: (context, _) {
          final logs = AppLogStore.instance.logs;
          if (logs.isEmpty) return const Center(child: Text('No logs available.'));
          return ListView.builder(
            itemCount: logs.length,
            itemBuilder: (context, i) {
              final log = logs[i];
              return Card(
                child: ListTile(
                  title: Text(log.message),
                  subtitle: Text('${log.source} • ${AppDateFormatter.dateTime(log.timestamp)}'),
                  trailing: Text(log.level.toUpperCase()),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

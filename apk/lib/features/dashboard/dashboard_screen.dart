import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/logs/app_log_store.dart';
import '../../core/storage/local_db.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/info_card.dart';
import '../../shared/models/submission_model.dart';
import '../../shared/repositories/backend_repository.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _loading = true;
  List<SubmissionModel> _submissions = <SubmissionModel>[];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      _submissions = await BackendRepository.instance.mySubmissions();
    } catch (_) {}
    if (!mounted) return;
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final pending = LocalDb.pendingBox().length;
    final submissionsToday = _submissions.where((s) {
      final now = DateTime.now();
      return s.createdAt.year == now.year &&
          s.createdAt.month == now.month &&
          s.createdAt.day == now.day;
    }).length;
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: EdgeInsets.zero,
        children: <Widget>[
          const Text(
            'Operational overview and quick status',
            style: TextStyle(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 14),
          if (_loading) const LinearProgressIndicator(),
          LayoutBuilder(
            builder: (context, constraints) {
              final isWide = constraints.maxWidth > 640;
              return Wrap(
                spacing: 12,
                runSpacing: 12,
                children: <Widget>[
                  SizedBox(
                    width: isWide ? (constraints.maxWidth - 12) / 2 : constraints.maxWidth,
                    child: InfoCard(
                      title: 'Submissions Today',
                      value: '$submissionsToday',
                      icon: Icons.assignment_turned_in,
                      color: AppColors.secondary,
                    ),
                  ),
                  SizedBox(
                    width: isWide ? (constraints.maxWidth - 12) / 2 : constraints.maxWidth,
                    child: InfoCard(
                      title: 'Pending Sync',
                      value: '$pending',
                      icon: Icons.sync_problem,
                      color: pending == 0 ? AppColors.success : AppColors.warning,
                    ),
                  ),
                ],
              );
            },
          ),
          const SizedBox(height: 14),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  const Text('Submissions Graph', style: TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 220,
                    child: LineChart(
                      LineChartData(
                        gridData: const FlGridData(show: true),
                        borderData: FlBorderData(show: false),
                        titlesData: const FlTitlesData(show: true),
                        lineBarsData: <LineChartBarData>[
                          LineChartBarData(
                            isCurved: true,
                            color: AppColors.primary,
                            barWidth: 3,
                            spots: _spotsForLastWeek(_submissions),
                            belowBarData: BarAreaData(
                              show: true,
                              color: AppColors.primary.withValues(alpha: 0.15),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  const Text('Team Chat Feed', style: TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 10),
                  _chatBubble('Supervisor', 'Daily entry status checked.'),
                  _chatBubble('System', pending == 0 ? 'All records synced.' : '$pending records waiting for sync.'),
                  _chatBubble('Reminder', 'Check-out and final submission before shift end.'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),
          AnimatedBuilder(
            animation: AppLogStore.instance,
            builder: (context, _) {
              final logs = AppLogStore.instance.logs.take(3).toList();
              return Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Row(
                        children: <Widget>[
                          const Text('Recent Error Logs', style: TextStyle(fontWeight: FontWeight.w700)),
                          const Spacer(),
                          TextButton(
                            onPressed: () => context.push('/logs'),
                            child: const Text('View All'),
                          ),
                        ],
                      ),
                      if (logs.isEmpty) const Text('No errors reported.'),
                      ...logs.map((log) => Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text(
                              '[${log.level.toUpperCase()}] ${log.source}: ${log.message}',
                              style: const TextStyle(fontSize: 12),
                            ),
                          )),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  static List<FlSpot> _spotsForLastWeek(List<SubmissionModel> list) {
    final now = DateTime.now();
    final points = <FlSpot>[];
    for (var i = 6; i >= 0; i--) {
      final day = now.subtract(Duration(days: i));
      final count = list.where((s) {
        return s.createdAt.year == day.year &&
            s.createdAt.month == day.month &&
            s.createdAt.day == day.day;
      }).length;
      points.add(FlSpot((6 - i).toDouble(), count.toDouble()));
    }
    return points;
  }

  Widget _chatBubble(String title, String message) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(top: 8),
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 3),
            Text(message),
          ],
        ),
      ),
    );
  }
}

class SubmissionValueModel {
  SubmissionValueModel({
    required this.parameterId,
    required this.parameterName,
    required this.parameterType,
    this.valueText,
    this.valueNumber,
  });

  final String parameterId;
  final String parameterName;
  final String parameterType;
  final String? valueText;
  final double? valueNumber;

  String get displayValue => valueNumber?.toString() ?? (valueText ?? '');

  factory SubmissionValueModel.fromJson(Map<String, dynamic> json) {
    return SubmissionValueModel(
      parameterId: (json['parameter_id'] ?? json['parameterId'] ?? '').toString(),
      parameterName: (json['parameter_name'] ?? json['parameterName'] ?? '').toString(),
      parameterType: (json['parameter_type'] ?? json['parameterType'] ?? '').toString(),
      valueText: json['value_text']?.toString(),
      valueNumber: (json['value_number'] as num?)?.toDouble(),
    );
  }
}

class SubmissionModel {
  SubmissionModel({
    required this.id,
    required this.status,
    required this.createdAt,
    this.submissionDate,
    this.siteName,
    this.notes,
    this.values = const <SubmissionValueModel>[],
  });

  final String id;
  final String status;
  final DateTime createdAt;
  final String? submissionDate;
  final String? siteName;
  final String? notes;
  final List<SubmissionValueModel> values;

  factory SubmissionModel.fromJson(Map<String, dynamic> json) {
    final valuesRaw = json['values'];
    final values = valuesRaw is List
        ? valuesRaw
            .whereType<Map>()
            .map((e) => SubmissionValueModel.fromJson(Map<String, dynamic>.from(e)))
            .toList()
        : <SubmissionValueModel>[];
    return SubmissionModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      status: (json['status'] ?? 'pending').toString(),
      createdAt: DateTime.tryParse('${json['submission_time'] ?? json['createdAt']}') ?? DateTime.now(),
      submissionDate: json['submission_date']?.toString(),
      siteName: json['site_name']?.toString(),
      notes: json['notes']?.toString(),
      values: values,
    );
  }
}


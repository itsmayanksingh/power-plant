class SiteParameter {
  SiteParameter({
    required this.id,
    required this.name,
    required this.type,
    this.required = false,
    this.options = const <String>[],
    this.min,
    this.max,
  });

  final String id;
  final String name;
  final String type;
  final bool required;
  final List<String> options;
  final double? min;
  final double? max;

  factory SiteParameter.fromJson(Map<String, dynamic> json) {
    final optionsRaw = json['options'];
    return SiteParameter(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      type: (json['type'] ?? 'text').toString(),
      required: (json['required'] ?? json['is_required'] ?? false) == true,
      options: optionsRaw is List ? optionsRaw.map((e) => '$e').toList() : const <String>[],
      min: ((json['min'] ?? json['min_value']) as num?)?.toDouble(),
      max: ((json['max'] ?? json['max_value']) as num?)?.toDouble(),
    );
  }
}

class SiteModel {
  SiteModel({
    required this.id,
    required this.name,
    required this.location,
    required this.parameters,
  });

  final String id;
  final String name;
  final String location;
  final List<SiteParameter> parameters;

  factory SiteModel.fromJson(Map<String, dynamic> json) {
    final paramList = (json['parameters'] as List?) ??
        (json['siteParameters'] as List?) ??
        (json['site_parameters'] as List?) ??
        <dynamic>[];
    return SiteModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      location: (json['location'] ?? '').toString(),
      parameters: paramList
          .whereType<Map>()
          .map((e) => SiteParameter.fromJson(Map<String, dynamic>.from(e)))
          .toList(),
    );
  }
}

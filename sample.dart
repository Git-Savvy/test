// sample.dart (imports + classes + mixins + async)
import 'dart:async';
import 'dart:convert';

mixin Logger {
  void log(String msg) => print('[LOG] $msg');
}

class Item {
  final String id;
  final String title;
  final List<String> tags;
  final DateTime createdAt;

  Item({
    required this.id,
    required this.title,
    this.tags = const [],
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'tags': tags,
    'createdAt': createdAt.toIso8601String(),
  };

  static Item fromJson(Map<String, dynamic> m) => Item(
    id: m['id'] as String,
    title: m['title'] as String? ?? '',
    tags: (m['tags'] as List? ?? []).map((e) => '$e').toList(),
    createdAt: DateTime.tryParse(m['createdAt'] as String? ?? '') ?? DateTime.now(),
  );
}

class IndexStore with Logger {
  final Map<String, Item> _data = {};

  void upsert(Item item) {
    if (item.id.trim().isEmpty) throw ArgumentError('id required');
    _data[item.id] = item;
    log('upsert ${item.id}');
  }

  List<Item> search({String query = '', String tag = ''}) {
    final q = query.trim().toLowerCase();
    return _data.values.where((it) {
      final okQ = q.isEmpty || it.title.toLowerCase().contains(q) || it.tags.any((t) => t.contains(q));
      final okT = tag.isEmpty || it.tags.contains(tag);
      return okQ && okT;
    }).toList();
  }

  Future<String> exportJson() async {
    await Future.delayed(const Duration(milliseconds: 10));
    return jsonEncode(_data.values.map((e) => e.toJson()).toList());
  }
}

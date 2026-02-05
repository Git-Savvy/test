# sample.rb (no imports; modules + classes + blocks + error handling)
module Indexing
  class Item
    attr_reader :id, :title, :tags

    def initialize(id:, title:, tags: [])
      raise ArgumentError, "id required" if id.to_s.strip.empty?
      @id = id
      @title = title.to_s
      @tags = tags.map(&:to_s)
    end
  end

  class Store
    def initialize
      @data = {}
    end

    def upsert(item)
      @data[item.id] = item
      item
    end

    def get!(id)
      @data.fetch(id) { raise KeyError, "not found: #{id}" }
    end

    def search(query: "", tag: "")
      q = query.to_s.strip.downcase
      t = tag.to_s.strip

      @data.values.select do |it|
        ok_q = q.empty? || it.title.downcase.include?(q) || it.tags.any? { |x| x.include?(q) }
        ok_t = t.empty? || it.tags.include?(t)
        ok_q && ok_t
      end
    end
  end
end

-- タグの使用回数を集計する関数を修正
DROP FUNCTION IF EXISTS get_tag_counts();

CREATE FUNCTION get_tag_counts() 
RETURNS TABLE (
  tag_id uuid, 
  tag_name text, 
  count bigint
) AS $$
  SELECT 
    t.id AS tag_id,
    t.name AS tag_name,
    COUNT(wt.work_id) AS count
  FROM 
    tags t
    LEFT JOIN work_tags wt ON t.id = wt.tag_id
  GROUP BY 
    t.id, t.name
  ORDER BY 
    count DESC;
$$ LANGUAGE sql;

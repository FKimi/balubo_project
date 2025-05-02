import React, { useRef, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

// タグと関連性のインターフェース
interface TagWithRelevance {
  name: string;
  relevance: number;
  category?: string;
}

interface TagNode {
  id: string;
  name: string;
  val: number; // サイズ（関連性に基づく）
  color: string;
  group: number;
}

interface TagLink {
  source: string;
  target: string;
  value: number; // リンクの強さ
}

interface TagGraphData {
  nodes: TagNode[];
  links: TagLink[];
}

interface TagForceGraphProps {
  tags: TagWithRelevance[];
  clusters: { name: string; tags: string[] }[];
}

const COLORS = [
  '#3366CC', '#DC3912', '#FF9900', '#109618', '#990099', '#0099C6',
  '#DD4477', '#66AA00', '#B82E2E', '#316395', '#994499', '#22AA99',
  '#FF4444', '#FFBB28', '#00C49F', '#FF8042', '#8884D8', '#82ca9d', '#a4de6c', '#d0ed57', '#2E86AB', '#F6C85F', '#6F4E7C', '#F7CAC9', '#92A8D1'
];

const TagForceGraph: React.FC<TagForceGraphProps> = ({ tags, clusters }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null);

  // タグとクラスターからグラフデータを生成
  const generateGraphData = (): TagGraphData => {
    // ノードの作成（タグごと）
    const nodes: TagNode[] = tags.map((tag) => {
      // タグが属するクラスターを特定
      const clusterIdx = clusters.findIndex(cluster => 
        cluster.tags.includes(tag.name)
      );
      // ノードサイズのスケーリング調整（最大値制限）
      const minVal = 5;
      const maxVal = 28;
      const scaledVal = Math.max(minVal, Math.min(maxVal, tag.relevance * 14));
      return {
        id: tag.name,
        name: tag.name,
        val: scaledVal,
        color: clusterIdx >= 0 ? COLORS[clusterIdx % COLORS.length] : '#CCCCCC',
        group: clusterIdx >= 0 ? clusterIdx : -1
      };
    });

    // リンクの作成（同じクラスター内のタグ同士を接続）
    const links: TagLink[] = [];
    
    clusters.forEach((cluster) => {
      // クラスター内の各タグを他のタグと接続
      for (let i = 0; i < cluster.tags.length; i++) {
        const sourceTag = cluster.tags[i];
        
        // 同じクラスター内の他のタグと接続
        for (let j = i + 1; j < cluster.tags.length; j++) {
          const targetTag = cluster.tags[j];
          
          // 両方のタグの関連性スコアを取得
          const sourceTagObj = tags.find(t => t.name === sourceTag);
          const targetTagObj = tags.find(t => t.name === targetTag);
          
          if (sourceTagObj && targetTagObj) {
            // 両方のタグの関連性の平均を計算
            const linkStrength = (sourceTagObj.relevance + targetTagObj.relevance) / 2;
            
            links.push({
              source: sourceTag,
              target: targetTag,
              value: linkStrength
            });
          }
        }
      }
    });

    return { nodes, links };
  };

  const graphData = generateGraphData();

  useEffect(() => {
    // グラフの初期化後、ズームをリセット
    if (graphRef.current) {
      graphRef.current.zoomToFit(350);
    }
  }, [tags, clusters]);

  return (
    <div className="w-full min-h-[300px] h-[40vh] max-h-[500px] bg-white rounded-lg shadow-sm">
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeLabel={(node: TagNode) => {
          return `<div style='font-size:14px;font-weight:bold;color:#222;'>${node.name}</div>`;
        }}
        nodeColor={(node: TagNode) => node.color}
        nodeVal={(node: TagNode) => node.val}
        linkWidth={(link: TagLink) => link.value * 2.2}
        linkColor={() => '#E5E7EB'}
        cooldownTicks={80}
        onEngineStop={() => graphRef.current && graphRef.current.zoomToFit(350)}
        enableNodeDrag={false}
      />
    </div>
  );
};

export default TagForceGraph;

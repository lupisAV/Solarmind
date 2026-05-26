import { useState } from 'react'

const NODE_W = 200
const NODE_H = 56
const LEVEL_H = 100

export default function TreeVisualizer({ treeJson, type, classNames }) {
  const [selectedNode, setSelectedNode] = useState(null)

  if (!treeJson) return <div className="tree-empty">Árbol no disponible</div>

  const layers = []
  const queue = [{ node: treeJson, x: 0, y: 0, layer: 0 }]
  const layerMap = {}

  while (queue.length > 0) {
    const { node, layer } = queue.shift()
    if (!layerMap[layer]) layerMap[layer] = []
    layerMap[layer].push(node)

    if (!node.is_leaf) {
      if (node.left) queue.push({ node: node.left, layer: layer + 1 })
      if (node.right) queue.push({ node: node.right, layer: layer + 1 })
    }
  }

  const maxLayer = Math.max(...Object.keys(layerMap).map(Number))
  const totalWidth = Math.max(900, Math.pow(2, maxLayer) * (NODE_W + 20))

  const nodePositions = {}

  Object.keys(layerMap).forEach(layerKey => {
    const layer = parseInt(layerKey)
    const nodes = layerMap[layer]
    const layerWidth = nodes.length * (NODE_W + 30)
    const startX = (totalWidth - layerWidth) / 2

    nodes.forEach((node, i) => {
      nodePositions[node.id] = {
        x: startX + i * (NODE_W + 30),
        y: layer * LEVEL_H + 30,
      }
    })
  })

  const maxY = (maxLayer + 1) * LEVEL_H + 60

  return (
    <div className="tree-visualizer">
      <div className="tree-scroll">
        <svg
          width={totalWidth}
          height={maxY}
          viewBox={`0 0 ${totalWidth} ${maxY}`}
          className="tree-svg"
        >
          {Object.entries(nodePositions).map(([nodeId, pos]) => {
            const node = findNode(treeJson, parseInt(nodeId))
            if (!node) return null

            return (
              <g key={`edges-${nodeId}`}>
                {!node.is_leaf && node.left && (() => {
                  const childPos = nodePositions[node.left.id]
                  if (!childPos) return null
                  return (
                    <line
                      x1={pos.x + NODE_W / 2}
                      y1={pos.y + NODE_H}
                      x2={childPos.x + NODE_W / 2}
                      y2={childPos.y}
                      stroke="rgba(245, 158, 11, 0.25)"
                      strokeWidth={1.5}
                    />
                  )
                })()}
                {!node.is_leaf && node.right && (() => {
                  const childPos = nodePositions[node.right.id]
                  if (!childPos) return null
                  return (
                    <line
                      x1={pos.x + NODE_W / 2}
                      y1={pos.y + NODE_H}
                      x2={childPos.x + NODE_W / 2}
                      y2={childPos.y}
                      stroke="rgba(34, 211, 238, 0.25)"
                      strokeWidth={1.5}
                    />
                  )
                })()}
              </g>
            )
          })}

          {collectAllNodes(treeJson).map(node => {
            const pos = nodePositions[node.id]
            if (!pos) return null

            const isSelected = selectedNode === node.id

            return (
              <g
                key={`node-${node.id}`}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => setSelectedNode(isSelected ? null : node.id)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={0}
                  y={0}
                  width={NODE_W}
                  height={NODE_H}
                  rx={8}
                  fill={node.is_leaf
                    ? 'rgba(30, 41, 59, 0.9)'
                    : 'rgba(15, 23, 42, 0.9)'
                  }
                  stroke={isSelected
                    ? 'var(--solar-gold)'
                    : node.is_leaf
                      ? 'rgba(34, 211, 238, 0.3)'
                      : 'rgba(245, 158, 11, 0.2)'
                  }
                  strokeWidth={isSelected ? 1.5 : 1}
                />

                {node.is_leaf ? (
                  <>
                    <text
                      x={NODE_W / 2}
                      y={22}
                      textAnchor="middle"
                      fill="var(--sky-cyan)"
                      fontSize={10}
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {type === 'regression'
                        ? `${node.prediction?.toFixed(1) ?? '?'} W/m²`
                        : classNames
                          ? classNames[node.predicted_class] ?? `Clase ${node.predicted_class}`
                          : `Clase ${node.predicted_class}`
                      }
                    </text>
                    <text
                      x={NODE_W / 2}
                      y={42}
                      textAnchor="middle"
                      fill="var(--text-muted)"
                      fontSize={9}
                      fontFamily="JetBrains Mono, monospace"
                    >
                      n={node.samples}
                    </text>
                  </>
                ) : (
                  <>
                    <text
                      x={NODE_W / 2}
                      y={22}
                      textAnchor="middle"
                      fill="var(--text-primary)"
                      fontSize={10}
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {node.feature}
                    </text>
                    <text
                      x={NODE_W / 2}
                      y={42}
                      textAnchor="middle"
                      fill="var(--text-secondary)"
                      fontSize={9}
                      fontFamily="JetBrains Mono, monospace"
                    >
                      &le; {node.threshold}
                    </text>
                  </>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      <div className="tree-legend">
        <span className="legend-item">
          <span className="legend-dot" style={{ background: 'rgba(245, 158, 11, 0.25)' }} /> Rama izquierda
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: 'rgba(34, 211, 238, 0.25)' }} /> Rama derecha
        </span>
        <span className="legend-item">
          <span className="legend-dot leaf" /> Nodo hoja
        </span>
      </div>
    </div>
  )
}

function findNode(root, id) {
  if (!root) return null
  if (root.id === id) return root
  return findNode(root.left, id) || findNode(root.right, id)
}

function collectAllNodes(node) {
  if (!node) return []
  return [node, ...collectAllNodes(node.left), ...collectAllNodes(node.right)]
}

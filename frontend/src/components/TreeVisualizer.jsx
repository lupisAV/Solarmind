import { useEffect, useRef, useState } from 'react'

const NODE_W = 220
const NODE_H = 74
const LEVEL_H = 122
const LEAF_GAP = 34
const SUMMARY_DEPTH = 3

export default function TreeVisualizer({ treeJson, treeText, type, classNames }) {
  const [selectedNode, setSelectedNode] = useState(treeJson?.id ?? null)
  const [showSvg, setShowSvg] = useState(true)
  const [fitToView, setFitToView] = useState(true)
  const scrollRef = useRef(null)

  useEffect(() => {
    setSelectedNode(treeJson?.id ?? null)
  }, [treeJson])

  useEffect(() => {
    if (!scrollRef.current || !treeJson || !showSvg || fitToView) return

    const summaryTree = pruneTree(treeJson, SUMMARY_DEPTH)
    const { positions, width } = layoutTree(summaryTree)
    const rootX = positions[summaryTree.id]?.x ?? width / 2
    const containerWidth = scrollRef.current.clientWidth
    const scrollTo = Math.max(0, rootX - containerWidth / 2)

    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = scrollTo
      }
    })
  }, [treeJson, showSvg, fitToView])

  if (!treeJson && !treeText) {
    return <div className="tree-empty">Arbol no disponible</div>
  }

  if (!showSvg || !treeJson) {
    return (
      <div className="tree-visualizer">
        {treeText ? (
          <pre className="tree-text-block">{treeText}</pre>
        ) : (
          <div className="tree-empty">Arbol no disponible</div>
        )}
        {treeJson && (
          <button className="tree-text-toggle" onClick={() => setShowSvg(true)}>
            Ver como grafico
          </button>
        )}
      </div>
    )
  }

  const summaryTree = pruneTree(treeJson, SUMMARY_DEPTH)
  const { positions: nodePositions, width: totalWidth, height: maxY } = layoutTree(summaryTree)
  const nodes = collectAllNodes(summaryTree)
  const detailNode = findNode(treeJson, selectedNode) || treeJson

  return (
    <div className="tree-visualizer">
      <div className="tree-toolbar">
        <button className="tree-text-toggle" onClick={() => setShowSvg(false)}>
          Ver como texto
        </button>
        <button className="tree-text-toggle" onClick={() => setFitToView(value => !value)}>
          {fitToView ? 'Tamano real' : 'Ajustar completo'}
        </button>
      </div>

      <div className="tree-summary-layout">
        <div className={`tree-scroll${fitToView ? ' fit' : ''}`} ref={scrollRef}>
          <svg
            width={fitToView ? '100%' : totalWidth}
            height={fitToView ? '100%' : maxY}
            viewBox={`0 0 ${totalWidth} ${maxY}`}
            preserveAspectRatio="xMidYMid meet"
            className="tree-svg"
          >
            {nodes.map(node => {
              const pos = nodePositions[node.id]
              if (!pos || node.is_leaf) return null

              return (
                <g key={`edges-${node.id}`}>
                  <TreeEdge parent={pos} child={nodePositions[node.left?.id]} label="Si" tone="left" />
                  <TreeEdge parent={pos} child={nodePositions[node.right?.id]} label="No" tone="right" />
                </g>
              )
            })}

            {nodes.map(node => {
              const pos = nodePositions[node.id]
              if (!pos) return null

              const isSelected = selectedNode === node.id

              return (
                <g
                  key={`node-${node.id}`}
                  transform={`translate(${pos.x - NODE_W / 2}, ${pos.y})`}
                  onClick={() => setSelectedNode(node.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <rect
                    x={0}
                    y={0}
                    width={NODE_W}
                    height={NODE_H}
                    rx={8}
                    fill={node.is_leaf
                      ? 'rgba(30, 41, 59, 0.94)'
                      : 'rgba(15, 23, 42, 0.94)'
                    }
                    stroke={isSelected
                      ? 'var(--solar-gold)'
                      : node.is_leaf
                        ? 'rgba(34, 211, 238, 0.36)'
                        : 'rgba(245, 158, 11, 0.26)'
                    }
                    strokeWidth={isSelected ? 1.8 : 1}
                  />

                  {node.is_leaf ? (
                    <LeafContent node={node} type={type} classNames={classNames} />
                  ) : (
                    <DecisionContent node={node} />
                  )}
                </g>
              )
            })}
          </svg>
        </div>

        <NodeDetails node={detailNode} root={treeJson} type={type} classNames={classNames} />
      </div>

      <div className="tree-legend">
        <span className="tree-legend-item">
          <span className="tree-legend-dot" style={{ background: 'rgba(245, 158, 11, 0.35)' }} /> Si / menor o igual
        </span>
        <span className="tree-legend-item">
          <span className="tree-legend-dot" style={{ background: 'rgba(34, 211, 238, 0.35)' }} /> No / mayor
        </span>
        <span className="tree-legend-item">
          <span className="tree-legend-dot leaf" /> Detalle en panel
        </span>
      </div>
    </div>
  )
}

function TreeEdge({ parent, child, label, tone }) {
  if (!parent || !child) return null

  const stroke = tone === 'left'
    ? 'rgba(245, 158, 11, 0.32)'
    : 'rgba(34, 211, 238, 0.32)'
  const labelColor = tone === 'left'
    ? 'rgba(245, 158, 11, 0.82)'
    : 'rgba(34, 211, 238, 0.82)'
  const midX = (parent.x + child.x) / 2
  const midY = parent.y + NODE_H + (child.y - parent.y - NODE_H) / 2

  return (
    <>
      <path
        d={`M ${parent.x} ${parent.y + NODE_H} C ${parent.x} ${midY}, ${child.x} ${midY}, ${child.x} ${child.y}`}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
      />
      <text
        x={midX}
        y={midY - 6}
        textAnchor="middle"
        fill={labelColor}
        fontSize={9}
        fontFamily="JetBrains Mono, monospace"
      >
        {label}
      </text>
    </>
  )
}

function DecisionContent({ node }) {
  return (
    <>
      <text x={NODE_W / 2} y={21} textAnchor="middle" fill="var(--text-primary)" fontSize={10} fontFamily="JetBrains Mono, monospace">
        {formatFeature(node.feature)}
      </text>
      <text x={NODE_W / 2} y={42} textAnchor="middle" fill="var(--text-secondary)" fontSize={9} fontFamily="JetBrains Mono, monospace">
        &le; {node.threshold}
      </text>
      <text x={NODE_W / 2} y={60} textAnchor="middle" fill="var(--text-muted)" fontSize={8} fontFamily="JetBrains Mono, monospace">
        n={node.samples} · impureza {node.impurity}
      </text>
    </>
  )
}

function LeafContent({ node, type, classNames }) {
  const hasHiddenChildren = Boolean(node.hasHiddenChildren)

  return (
    <>
      <text x={NODE_W / 2} y={24} textAnchor="middle" fill="var(--sky-cyan)" fontSize={10} fontFamily="JetBrains Mono, monospace">
        {hasHiddenChildren ? 'Rama continua' : formatPrediction(node, type, classNames)}
      </text>
      <text x={NODE_W / 2} y={44} textAnchor="middle" fill="var(--text-muted)" fontSize={9} fontFamily="JetBrains Mono, monospace">
        n={node.samples}
      </text>
      <text x={NODE_W / 2} y={61} textAnchor="middle" fill="var(--text-muted)" fontSize={8} fontFamily="JetBrains Mono, monospace">
        {hasHiddenChildren ? `+${node.hiddenNodeCount} nodos ocultos` : 'click para detalle'}
      </text>
    </>
  )
}

function NodeDetails({ node, root, type, classNames }) {
  if (!node) return null

  const path = getPathToNode(root, node.id)

  return (
    <aside className="tree-detail-panel">
      <span className="tree-detail-kicker">Nodo {node.id}</span>
      <h4 className="tree-detail-title">
        {node.is_leaf ? 'Prediccion' : formatFeature(node.feature)}
      </h4>

      {path.length > 1 && (
        <div className="tree-detail-path">
          <span>Ruta</span>
          <ol>
            {path.slice(1).map(step => (
              <li key={`${step.nodeId}-${step.direction}`}>
                <strong>{step.direction}</strong>
                <span>{formatFeature(step.feature)} {step.direction === 'Si' ? '≤' : '>'} {step.threshold}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {!node.is_leaf && (
        <div className="tree-detail-rule">
          <span>Condicion</span>
          <strong>{formatFeature(node.feature)} ≤ {node.threshold}</strong>
        </div>
      )}

      {node.is_leaf && (
        <div className="tree-detail-rule">
          <span>{node.hasHiddenChildren ? 'Resumen' : 'Salida'}</span>
          <strong>
            {node.hasHiddenChildren
              ? `Esta rama continua con ${node.hiddenNodeCount} nodos mas`
              : formatPrediction(node, type, classNames)}
          </strong>
        </div>
      )}

      <dl className="tree-detail-list">
        <div>
          <dt>Muestras</dt>
          <dd>{node.samples}</dd>
        </div>
        <div>
          <dt>Impureza</dt>
          <dd>{node.impurity}</dd>
        </div>
        {!node.is_leaf && (
          <>
            <div>
              <dt>Rama Si</dt>
              <dd>Nodo {node.left?.id}</dd>
            </div>
            <div>
              <dt>Rama No</dt>
              <dd>Nodo {node.right?.id}</dd>
            </div>
          </>
        )}
      </dl>
    </aside>
  )
}

function findNode(root, id) {
  if (!root || id == null) return null
  if (root.id === id) return root
  return findNode(root.left, id) || findNode(root.right, id)
}

function collectAllNodes(node) {
  if (!node) return []
  return [node, ...collectAllNodes(node.left), ...collectAllNodes(node.right)]
}

function pruneTree(node, maxDepth, depth = 0) {
  if (!node) return null
  if (depth >= maxDepth || node.is_leaf) {
    const hiddenNodeCount = node.is_leaf ? 0 : Math.max(0, countNodes(node) - 1)
    return {
      ...node,
      is_leaf: true,
      hasHiddenChildren: hiddenNodeCount > 0,
      hiddenNodeCount,
      left: undefined,
      right: undefined,
    }
  }

  return {
    ...node,
    left: pruneTree(node.left, maxDepth, depth + 1),
    right: pruneTree(node.right, maxDepth, depth + 1),
  }
}

function layoutTree(root) {
  const positions = {}
  const leaves = countLeaves(root)
  const width = Math.max(760, leaves * (NODE_W + LEAF_GAP) + 48)
  const depth = getDepth(root)
  const height = depth * LEVEL_H + NODE_H + 52
  let nextLeafX = NODE_W / 2 + 24

  function place(node, level) {
    const y = level * LEVEL_H + 28

    if (node.is_leaf) {
      const x = nextLeafX
      nextLeafX += NODE_W + LEAF_GAP
      positions[node.id] = { x, y }
      return x
    }

    const leftX = place(node.left, level + 1)
    const rightX = place(node.right, level + 1)
    const x = (leftX + rightX) / 2
    positions[node.id] = { x, y }
    return x
  }

  place(root, 0)
  return { positions, width, height }
}

function countNodes(node) {
  if (!node) return 0
  return 1 + countNodes(node.left) + countNodes(node.right)
}

function countLeaves(node) {
  if (!node) return 0
  if (node.is_leaf) return 1
  return countLeaves(node.left) + countLeaves(node.right)
}

function getDepth(node) {
  if (!node) return 0
  if (node.is_leaf) return 1
  return 1 + Math.max(getDepth(node.left), getDepth(node.right))
}

function formatFeature(feature) {
  return String(feature || '').replace(/_/g, ' ')
}

function formatPrediction(node, type, classNames) {
  if (type === 'regression') {
    return `${node.prediction != null ? node.prediction.toFixed(1) : '?'} W/m²`
  }

  if (classNames) {
    return classNames[node.predicted_class] ?? `Clase ${node.predicted_class}`
  }

  return `Clase ${node.predicted_class}`
}

function getPathToNode(root, targetId) {
  if (!root || targetId == null) return []

  function walk(node, steps) {
    if (!node) return null
    if (node.id === targetId) return [...steps, { nodeId: node.id }]

    const leftPath = walk(node.left, [
      ...steps,
      {
        nodeId: node.id,
        direction: 'Si',
        feature: node.feature,
        threshold: node.threshold,
      },
    ])
    if (leftPath) return leftPath

    return walk(node.right, [
      ...steps,
      {
        nodeId: node.id,
        direction: 'No',
        feature: node.feature,
        threshold: node.threshold,
      },
    ])
  }

  return walk(root, []) || []
}

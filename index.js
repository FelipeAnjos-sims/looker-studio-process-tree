const dscc = require('@google/dscc');
const d3 = require('d3');

function draw(data) {
  const container = document.getElementById('chart-container');
  if (!container) {
    const div = document.createElement('div');
    div.id = 'chart-container';
    div.style.width = '100%';
    div.style.height = '100%';
    document.body.appendChild(div);
  }
  
  const width = data.window.width;
  const height = data.window.height;
  if (width === 0 || height === 0) return;

  const style = data.style;
  const primaryColor = style.primaryColor ? style.primaryColor.color : '#D97706';
  const cardBg = style.cardBackground ? style.cardBackground.color : '#FFFFFF';
  const textColor = style.textColor ? style.textColor.color : '#1F2937';
  const lineColor = style.lineColor ? style.lineColor.color : '#9CA3AF';

  const rows = data.tables.DEFAULT;
  const svgSelection = d3.select('#chart-container');
  svgSelection.html('');

  if (!rows || rows.length === 0) {
    svgSelection.append('div')
      .style('padding', '20px')
      .style('color', textColor)
      .text('Por favor, configure as dimensões (Pai e Filho) e a métrica no Looker Studio.');
    return;
  }

  const hierarchyMap = { name: "Var Plan", children: [] };
  const mapNodes = {};

  rows.forEach(row => {
    const parent = row.dim0 ? row.dim0[0] : 'Raiz';
    const child = row.dim1 ? row.dim1[0] : 'Item';
    const metricVal = row.metric0 ? parseFloat(row.metric0[0]) : 0;

    if (!mapNodes[parent]) {
      mapNodes[parent] = { name: parent, value: 0, children: [] };
      hierarchyMap.children.push(mapNodes[parent]);
    }
    mapNodes[parent].children.push({ name: child, value: metricVal });
    mapNodes[parent].value += metricVal;
  });

  const root = d3.hierarchy(hierarchyMap);
  const treeLayout = d3.tree().size([height - 60, width - 200]);
  treeLayout(root);

  const svg = svgSelection.append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', 'translate(80, 30)');

  svg.selectAll('.link')
    .data(root.links())
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('fill', 'none')
    .attr('stroke', lineColor)
    .attr('stroke-width', 1.5)
    .attr('d', d3.linkHorizontal().x(d => d.y).y(d => d.x));

  const node = svg.selectAll('.node')
    .data(root.descendants())
    .enter()
    .append('g')
    .attr('transform', d => `translate(${d.y},${d.x})`);

  node.append('rect')
    .attr('x', -10).attr('y', -20)
    .attr('width', 130).attr('height', 40)
    .attr('rx', 6).attr('ry', 6)
    .attr('fill', cardBg)
    .attr('stroke', lineColor)
    .attr('stroke-width', 0.8);

  node.append('rect')
    .attr('x', 5).attr('y', 2)
    .attr('width', 100).attr('height', 6)
    .attr('rx', 3).attr('ry', 3)
    .attr('fill', '#E5E7EB');

  const maxVal = d3.max(root.descendants(), d => Math.abs(d.data.value || 1));
  node.append('rect')
    .attr('x', 5).attr('y', 2)
    .attr('width', d => {
      const val = Math.abs(d.data.value || 0);
      return maxVal ? Math.min(100, (val / maxVal) * 100) : 0;
    })
    .attr('height', 6)
    .attr('rx', 3).attr('ry', 3)
    .attr('fill', primaryColor);

  node.append('text')
    .attr('dy', -7).attr('dx', 5)
    .attr('fill', textColor)
    .style('font-weight', '600')
    .style('font-size', '10px')
    .text(d => d.data.name.length > 16 ? d.data.name.substring(0, 14) + '...' : d.data.name);

  node.append('text')
    .attr('dy', 18).attr('dx', 5)
    .attr('fill', '#6B7280')
    .style('font-size', '9px')
    .text(d => d.data.value !== undefined ? d.data.value.toLocaleString() : '');
}

dscc.subscribeToData(draw, { transform: dscc.tableTransform });

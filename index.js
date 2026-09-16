function drawVisualization(data) {
  const container = document.getElementById('tree-container');
  container.innerHTML = '';

  // Extrai linhas da tabela do Looker Studio
  const rows = data.tables.default;
  
  if (!rows || rows.length === 0) {
    container.innerHTML = '<div style="color: #757575; padding: 12px;">Aguardando dados ou configuração de dimensões...</div>';
    return;
  }

  // Agrupamento hierárquico simples baseado nas ramificações
  const treeData = {};
  rows.forEach(row => {
    const dimensions = row.dim_branch; // Array de dimensões hierárquicas
    const metric = row.metric_val[0];
    
    let currentLevel = treeData;
    dimensions.forEach((dim, index) => {
      if (!currentLevel[dim]) {
        currentLevel[dim] = {
          name: dim,
          metric: 0,
          children: {}
        };
      }
      currentLevel[dim].metric += metric;
      currentLevel = currentLevel[dim].children;
    });
  });

  // Função recursiva para renderizar os nós
  function renderNode(nodeObj) {
    const wrapper = document.createElement('div');
    
    const nodeDiv = document.createElement('div');
    nodeDiv.className = 'process-node';
    
    const hasChildren = Object.keys(nodeObj.children).length > 0;
    
    nodeDiv.innerHTML = `
      <div class="node-info">
        <span class="node-title">${nodeObj.name}</span>
        <span class="node-metric">Valor: ${nodeObj.metric.toLocaleString()}</span>
      </div>
      ${hasChildren ? '<button class="toggle-btn">-</button>' : ''}
    `;
    
    wrapper.appendChild(nodeDiv);

    if (hasChildren) {
      const childrenContainer = document.createElement('div');
      childrenContainer.className = 'children-container';

      const btn = nodeDiv.querySelector('.toggle-btn');
      btn.addEventListener('click', () => {
        const isCollapsed = childrenContainer.classList.toggle('collapsed');
        btn.textContent = isCollapsed ? '+' : '-';
      });

      Object.values(nodeObj.children).forEach(child => {
        childrenContainer.appendChild(renderNode(child));
      });

      wrapper.appendChild(childrenContainer);
    }

    return wrapper;
  }

  // Renderiza a raiz da árvore
  Object.values(treeData).forEach(rootNode => {
    container.appendChild(renderNode(rootNode));
  });
}

// Inscreve a visualização no Looker Studio
dscc.subscribeToData(drawVisualization, { transform: dscc.tableTransform });

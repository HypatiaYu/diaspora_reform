function updateResourceUI() {
    let total = 0;
    if (typeof ResourceNode !== 'undefined' && ResourceNode.instances) {
        total = ResourceNode.instances.reduce((sum, rp) => sum + rp.amount, 0);
    }
    
    const resourcesDiv = document.getElementById('resources');
    if (resourcesDiv) {
        let html = '<strong>Resource Nodes:</strong><br>';
        if (typeof ResourceNode !== 'undefined' && ResourceNode.instances) {
            ResourceNode.instances.forEach((rp, i) => {
                html += `Node #${i + 1}: ${rp.amount} units<br>`;
            });
        }
        html += `<br><strong>Total Available:</strong> ${total} units`;
        resourcesDiv.innerHTML = html;
    }
}

function spawnRandomResources() {
    if (typeof ResourceNode !== 'undefined') {
        ResourceNode.instances.forEach(rp => {
            rp.remove();
        });
        ResourceNode.instances = [];
    }
    
    const numPoints = Math.floor(Math.random() * 6) + 3;
    
    for (let i = 0; i < numPoints; i++) {
        const x = (Math.random() - 0.5) * 45;
        const z = (Math.random() - 0.5) * 45;
        const amount = Math.floor(Math.random() * 150) + 50;
        
        new ResourceNode(scene, {x, z}, amount);
    }
    
    updateResourceUI();
}

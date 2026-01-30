class InventoryManager {
    constructor() {
        this.products = this.loadProducts();
        this.reductionHistory = this.loadReductionHistory();
        this.hasUnsavedChanges = false;
        this.productToDelete = null;
        this.productToEditPrice = null;
        this.productToReduce = null;
        this.reductionAmount = 0;
        
        this.initializeElements();
        this.bindEvents();
        this.renderProducts();
        this.updateStats();
        this.updateSaveButton();
    }

    initializeElements() {
        // Formulario de productos
        this.productForm = document.getElementById('productForm');
        this.productNameInput = document.getElementById('productName');
        this.productPriceInput = document.getElementById('productPrice');
        this.productQuantityInput = document.getElementById('productQuantity');
        this.productCategoryInput = document.getElementById('productCategory');
        
        // Inventario
        this.productGrid = document.getElementById('productGrid');
        this.searchInput = document.getElementById('searchInput');
        this.categoryFilter = document.getElementById('categoryFilter');
        
        // Estadísticas
        this.totalProductsSpan = document.getElementById('totalProducts');
        this.totalItemsSpan = document.getElementById('totalItems');
        
        // Botones principales
        this.saveBtn = document.getElementById('saveBtn');
        this.reportBtn = document.getElementById('reportBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.importBtn = document.getElementById('importBtn');
        this.importFileInput = document.getElementById('importFileInput');
        
        // Modales
        this.deleteModal = document.getElementById('deleteModal');
        this.priceModal = document.getElementById('priceModal');
        this.reductionModal = document.getElementById('reductionModal');
        
        // Notificaciones
        this.notificationsContainer = document.getElementById('notifications');
        
        console.log('Elementos inicializados correctamente');
    }

    bindEvents() {
        // Formulario de productos
        if (this.productForm) {
            this.productForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddProduct(e);
            });
        }
        
        // Botones principales
        if (this.saveBtn) {
            this.saveBtn.addEventListener('click', () => this.saveProducts());
        }
        if (this.reportBtn) {
            this.reportBtn.addEventListener('click', () => this.generateReport());
        }
        if (this.exportBtn) {
            this.exportBtn.addEventListener('click', () => this.exportInventory());
        }
        if (this.importBtn) {
            this.importBtn.addEventListener('click', () => this.importFileInput.click());
        }
        if (this.importFileInput) {
            this.importFileInput.addEventListener('change', (e) => this.importInventory(e));
        }
        
        // Búsqueda y filtros
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => this.renderProducts());
        }
        if (this.categoryFilter) {
            this.categoryFilter.addEventListener('change', () => this.renderProducts());
        }
        
        // Modales
        this.bindModalEvents();
        
        console.log('Event listeners configurados');
    }

    bindModalEvents() {
        // Modal de eliminación
        const cancelDelete = document.getElementById('cancelDelete');
        const confirmDelete = document.getElementById('confirmDelete');
        
        if (cancelDelete) {
            cancelDelete.addEventListener('click', () => this.hideDeleteModal());
        }
        if (confirmDelete) {
            confirmDelete.addEventListener('click', () => this.confirmDeleteProduct());
        }
        
        // Modal de precio
        const cancelPriceEdit = document.getElementById('cancelPriceEdit');
        const confirmPriceEdit = document.getElementById('confirmPriceEdit');
        const newPriceInput = document.getElementById('newPrice');
        
        if (cancelPriceEdit) {
            cancelPriceEdit.addEventListener('click', () => this.hidePriceModal());
        }
        if (confirmPriceEdit) {
            confirmPriceEdit.addEventListener('click', () => this.confirmPriceEdit());
        }
        if (newPriceInput) {
            newPriceInput.addEventListener('input', () => this.updatePriceChangeIndicator());
        }
        
        // Modal de reducción
        const cancelReduction = document.getElementById('cancelReduction');
        const confirmReduction = document.getElementById('confirmReduction');
        const reductionReason = document.getElementById('reductionReason');
        
        if (cancelReduction) {
            cancelReduction.addEventListener('click', () => this.hideReductionModal());
        }
        if (confirmReduction) {
            confirmReduction.addEventListener('click', () => this.confirmReduction());
        }
        if (reductionReason) {
            reductionReason.addEventListener('change', () => this.toggleCustomReasonField());
        }
        
        // Cerrar modales al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.hideAllModals();
            }
        });
    }

    // Modal methods
    showDeleteModal() {
        if (!this.deleteModal || !this.productToDelete) return;
        
        const productNameSpan = document.getElementById('productToDelete');
        if (productNameSpan) {
            productNameSpan.textContent = this.productToDelete.name;
        }
        
        this.deleteModal.classList.add('show');
    }

    hideDeleteModal() {
        if (this.deleteModal) {
            this.deleteModal.classList.remove('show');
        }
        this.productToDelete = null;
    }

    confirmDeleteProduct() {
        if (!this.productToDelete) return;
        
        const productIndex = this.products.findIndex(p => p.id === this.productToDelete.id);
        if (productIndex !== -1) {
            const productName = this.products[productIndex].name;
            this.products.splice(productIndex, 1);
            
            this.markUnsavedChanges();
            this.renderProducts();
            this.updateStats();
            
            this.showNotification(`✅ Producto "${productName}" eliminado`, 'success');
        }
        
        this.hideDeleteModal();
    }

    showPriceModal() {
        if (!this.priceModal || !this.productToEditPrice) return;
        
        const productNameSpan = document.getElementById('priceProductName');
        const currentPriceSpan = document.getElementById('currentPrice');
        const newPriceInput = document.getElementById('newPrice');
        
        if (productNameSpan) {
            productNameSpan.textContent = this.productToEditPrice.name;
        }
        if (currentPriceSpan) {
            currentPriceSpan.textContent = `$${this.productToEditPrice.price.toFixed(2)}`;
        }
        if (newPriceInput) {
            newPriceInput.value = this.productToEditPrice.price.toFixed(2);
        }
        
        this.updatePriceChangeIndicator();
        this.priceModal.classList.add('show');
    }

    hidePriceModal() {
        if (this.priceModal) {
            this.priceModal.classList.remove('show');
        }
        this.productToEditPrice = null;
    }

    updatePriceChangeIndicator() {
        const newPriceInput = document.getElementById('newPrice');
        const indicator = document.getElementById('priceChangeIndicator');
        
        if (!newPriceInput || !indicator || !this.productToEditPrice) return;
        
        const newPrice = parseFloat(newPriceInput.value);
        const currentPrice = this.productToEditPrice.price;
        
        if (isNaN(newPrice) || newPrice === currentPrice) {
            indicator.style.display = 'none';
            return;
        }
        
        indicator.style.display = 'block';
        
        if (newPrice > currentPrice) {
            indicator.className = 'price-change-indicator increase';
            indicator.textContent = `⬆️ Aumento: +$${(newPrice - currentPrice).toFixed(2)}`;
        } else {
            indicator.className = 'price-change-indicator decrease';
            indicator.textContent = `⬇️ Reducción: -$${(currentPrice - newPrice).toFixed(2)}`;
        }
    }

    confirmPriceEdit() {
        if (!this.productToEditPrice) return;
        
        const newPriceInput = document.getElementById('newPrice');
        if (!newPriceInput) return;
        
        const newPrice = parseFloat(newPriceInput.value);
        
        if (isNaN(newPrice) || newPrice < 0) {
            this.showNotification('❌ Por favor ingresa un precio válido', 'error');
            return;
        }
        
        const oldPrice = this.productToEditPrice.price;
        this.productToEditPrice.price = newPrice;
        
        this.markUnsavedChanges();
        this.renderProducts();
        this.updateStats();
        
        const changeType = newPrice > oldPrice ? 'aumentado' : 'reducido';
        this.showNotification(`✅ Precio ${changeType}: ${this.productToEditPrice.name} - $${oldPrice.toFixed(2)} → $${newPrice.toFixed(2)}`, 'success');
        
        this.hidePriceModal();
    }

    showReductionModal() {
        if (!this.reductionModal || !this.productToReduce) return;
        
        const productNameSpan = document.getElementById('reductionProductName');
        const reductionAmountSpan = document.getElementById('reductionAmount');
        
        if (productNameSpan) {
            productNameSpan.textContent = this.productToReduce.name;
        }
        if (reductionAmountSpan) {
            reductionAmountSpan.textContent = this.reductionAmount;
        }
        
        // Reset form
        const reductionReason = document.getElementById('reductionReason');
        const customReason = document.getElementById('customReason');
        const reductionNotes = document.getElementById('reductionNotes');
        
        if (reductionReason) reductionReason.value = '';
        if (customReason) customReason.value = '';
        if (reductionNotes) reductionNotes.value = '';
        
        this.toggleCustomReasonField();
        this.reductionModal.classList.add('show');
    }

    hideReductionModal() {
        if (this.reductionModal) {
            this.reductionModal.classList.remove('show');
        }
        this.productToReduce = null;
        this.reductionAmount = 0;
    }

    toggleCustomReasonField() {
        const reductionReason = document.getElementById('reductionReason');
        const customReasonGroup = document.getElementById('customReasonGroup');
        
        if (!reductionReason || !customReasonGroup) return;
        
        if (reductionReason.value === 'otro') {
            customReasonGroup.style.display = 'block';
        } else {
            customReasonGroup.style.display = 'none';
        }
    }

    confirmReduction() {
        if (!this.productToReduce) return;
        
        const reductionReason = document.getElementById('reductionReason');
        const customReason = document.getElementById('customReason');
        const reductionNotes = document.getElementById('reductionNotes');
        
        if (!reductionReason || !reductionReason.value) {
            this.showNotification('❌ Por favor selecciona un motivo para la reducción', 'error');
            return;
        }
        
        if (reductionReason.value === 'otro' && (!customReason || !customReason.value.trim())) {
            this.showNotification('❌ Por favor especifica el motivo personalizado', 'error');
            return;
        }
        
        // Registrar en el historial de reducciones
        const reasonText = reductionReason.value === 'otro' ? customReason.value : reductionReason.options[reductionReason.selectedIndex].text;
        const reductionRecord = {
            id: Date.now().toString(),
            productId: this.productToReduce.id,
            productName: this.productToReduce.name,
            productCode: this.productToReduce.code,
            quantityReduced: this.reductionAmount,
            previousQuantity: this.productToReduce.quantity,
            newQuantity: this.productToReduce.quantity - this.reductionAmount,
            reason: reasonText,
            reasonCode: reductionReason.value,
            notes: reductionNotes ? reductionNotes.value.trim() : '',
            date: new Date().toISOString(),
            timestamp: Date.now()
        };
        
        this.reductionHistory.push(reductionRecord);
        
        // Aplicar la reducción
        this.productToReduce.quantity -= this.reductionAmount;
        
        this.markUnsavedChanges();
        this.renderProducts();
        this.updateStats();
        
        // Mostrar notificación con el motivo
        this.showNotification(`✅ Cantidad reducida: ${this.productToReduce.name}\nMotivo: ${reasonText}`, 'success');
        
        this.hideReductionModal();
    }

    hideAllModals() {
        this.hideDeleteModal();
        this.hidePriceModal();
        this.hideReductionModal();
    }

    loadProducts() {
        try {
            const saved = localStorage.getItem('inventoryProducts');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error cargando productos:', error);
            return [];
        }
    }

    loadReductionHistory() {
        try {
            const saved = localStorage.getItem('inventoryReductionHistory');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error cargando historial de reducciones:', error);
            return [];
        }
    }

    saveProducts() {
        try {
            localStorage.setItem('inventoryProducts', JSON.stringify(this.products));
            localStorage.setItem('inventoryReductionHistory', JSON.stringify(this.reductionHistory));
            this.hasUnsavedChanges = false;
            this.updateSaveButton();
            this.showNotification('✅ Cambios guardados exitosamente', 'success');
        } catch (error) {
            console.error('Error guardando productos:', error);
            this.showNotification('❌ Error al guardar los cambios', 'error');
        }
    }

    generateProductCode() {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `PRD${timestamp}${random}`;
    }

    handleAddProduct(e) {
        e.preventDefault();
        
        const name = this.productNameInput.value.trim();
        const price = parseFloat(this.productPriceInput.value);
        const quantity = parseInt(this.productQuantityInput.value);
        const category = this.productCategoryInput.value;
        
        if (!name || isNaN(price) || isNaN(quantity) || !category) {
            this.showNotification('❌ Por favor completa todos los campos', 'error');
            return;
        }
        
        if (price < 0 || quantity < 0) {
            this.showNotification('❌ El precio y la cantidad deben ser valores positivos', 'error');
            return;
        }
        
        // Generar código único
        let code;
        do {
            code = this.generateProductCode();
        } while (this.products.some(p => p.code === code));
        
        const newProduct = {
            id: Date.now().toString(),
            name,
            code,
            price,
            quantity,
            category,
            createdAt: new Date().toISOString()
        };
        
        this.products.push(newProduct);
        this.markUnsavedChanges();
        this.renderProducts();
        this.updateStats();
        this.productForm.reset();
        
        this.showNotification(`✅ Producto "${name}" agregado exitosamente`, 'success');
    }

    markUnsavedChanges() {
        this.hasUnsavedChanges = true;
        this.updateSaveButton();
    }

    updateSaveButton() {
        if (!this.saveBtn) return;
        
        if (this.hasUnsavedChanges) {
            this.saveBtn.classList.add('unsaved');
            this.saveBtn.innerHTML = `
                <i class="fas fa-exclamation-circle"></i>
                <span>Guardar Cambios</span>
                <div class="save-indicator"></div>
            `;
        } else {
            this.saveBtn.classList.remove('unsaved');
            this.saveBtn.innerHTML = `
                <i class="fas fa-save"></i>
                <span>Guardar Cambios</span>
                <div class="save-indicator"></div>
            `;
        }
    }

    getCategoryInfo(category) {
        const categories = {
            'hogar': { name: '🏠 Hogar', color: '#8b5cf6' },
            'comida': { name: '🍔 Comida', color: '#10b981' },
            'chucheria': { name: '🍭 Chuchería', color: '#ec4899' },
            'bebidas': { name: '🥤 Bebidas', color: '#3b82f6' },
            'otros': { name: '📦 Otros', color: '#6b7280' }
        };
        return categories[category] || { name: category, color: '#6b7280' };
    }

    getFilteredProducts() {
        let filtered = [...this.products];
        
        const searchTerm = this.searchInput ? this.searchInput.value.toLowerCase().trim() : '';
        if (searchTerm) {
            filtered = filtered.filter(product => 
                product.name.toLowerCase().includes(searchTerm) ||
                product.code.toLowerCase().includes(searchTerm)
            );
        }
        
        const categoryFilter = this.categoryFilter ? this.categoryFilter.value : '';
        if (categoryFilter) {
            filtered = filtered.filter(product => product.category === categoryFilter);
        }
        
        return filtered;
    }

    renderProducts() {
        if (!this.productGrid) return;
        
        const filteredProducts = this.getFilteredProducts();
        
        if (filteredProducts.length === 0) {
            this.productGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-box-open"></i>
                    </div>
                    <h3>${this.products.length === 0 ? 'No hay productos' : 'No se encontraron productos'}</h3>
                    <p>${this.products.length === 0 ? 'Agrega tu primer producto para comenzar' : 'Intenta con otros términos de búsqueda'}</p>
                </div>
            `;
            return;
        }
        
        this.productGrid.innerHTML = filteredProducts.map((product, index) => {
            const categoryInfo = this.getCategoryInfo(product.category);
            return `
                <div class="product-card" style="animation-delay: ${index * 0.1}s">
                    <div class="product-header">
                        <div class="product-info">
                            <h3>${this.escapeHtml(product.name)}</h3>
                            <div class="product-code">${this.escapeHtml(product.code)}</div>
                        </div>
                        <div class="product-actions">
                            <button class="action-btn delete" onclick="inventory.deleteProduct('${product.id}')" title="Eliminar producto">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="product-details">
                        <div class="detail-item">
                            <div class="detail-label">Precio</div>
                            <div class="detail-value price-editable" onclick="inventory.editPrice('${product.id}')">$${product.price.toFixed(2)}</div>
                        </div>
                        
                        <div class="detail-item">
                            <div class="detail-label">Valor Total</div>
                            <div class="detail-value">$${(product.price * product.quantity).toFixed(2)}</div>
                        </div>
                        
                        <div class="category-badge" style="background: linear-gradient(135deg, ${categoryInfo.color} 0%, ${this.darkenColor(categoryInfo.color, 20)} 100%)">
                            ${categoryInfo.name}
                        </div>
                    </div>
                    
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="inventory.updateQuantity('${product.id}', -1)" ${product.quantity <= 0 ? 'disabled' : ''}>
                            <i class="fas fa-minus"></i>
                        </button>
                        <div class="quantity-display">${product.quantity}</div>
                        <button class="quantity-btn" onclick="inventory.updateQuantity('${product.id}', 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateQuantity(productId, change) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        const newQuantity = product.quantity + change;
        if (newQuantity < 0) return;
        
        // Si es una reducción, mostrar modal de motivo
        if (change < 0 && product.quantity > 0) {
            this.productToReduce = product;
            this.reductionAmount = Math.abs(change);
            this.showReductionModal();
            return;
        }
        
        product.quantity = newQuantity;
        this.markUnsavedChanges();
        this.renderProducts();
        this.updateStats();
    }

    deleteProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        this.productToDelete = product;
        this.showDeleteModal();
    }

    editPrice(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        this.productToEditPrice = product;
        this.showPriceModal();
    }

    updateStats() {
        if (!this.totalProductsSpan || !this.totalItemsSpan) return;
        
        const totalProducts = this.products.length;
        const totalItems = this.products.reduce((sum, product) => sum + product.quantity, 0);
        
        this.totalProductsSpan.textContent = totalProducts;
        this.totalItemsSpan.textContent = totalItems;
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    generateReport() {
        if (this.products.length === 0) {
            this.showNotification('⚠️ No hay productos para generar el reporte', 'warning');
            return;
        }

        try {
            // Verificar que jsPDF esté disponible
            if (typeof window.jspdf === 'undefined') {
                this.showNotification('❌ Error: Librería PDF no disponible', 'error');
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 20;
            let yPosition = margin;
            
            // Título del reporte
            doc.setFontSize(20);
            doc.setFont(undefined, 'bold');
            doc.text('REPORTE DE INVENTARIO', pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 15;
            
            // Fecha y hora
            const now = new Date();
            const dateStr = now.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            doc.text(`Generado el: ${dateStr}`, pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 20;
            
            // Estadísticas generales
            const totalProducts = this.products.length;
            const totalItems = this.products.reduce((sum, product) => sum + product.quantity, 0);
            const totalValue = this.products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
            
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('RESUMEN GENERAL', margin, yPosition);
            yPosition += 10;
            
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            doc.text(`Total de productos únicos: ${totalProducts}`, margin, yPosition);
            yPosition += 7;
            doc.text(`Total de items en inventario: ${totalItems}`, margin, yPosition);
            yPosition += 7;
            doc.text(`Valor total del inventario: $${totalValue.toFixed(2)}`, margin, yPosition);
            yPosition += 20;
            
            // Lista detallada de productos
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('DETALLE DE PRODUCTOS', margin, yPosition);
            yPosition += 15;
            
            // Encabezados de tabla
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            const headers = ['Código', 'Nombre', 'Categoría', 'Precio', 'Cantidad', 'Total'];
            const colWidths = [25, 60, 35, 20, 20, 25];
            let xPosition = margin;
            
            headers.forEach((header, index) => {
                doc.text(header, xPosition, yPosition);
                xPosition += colWidths[index];
            });
            yPosition += 8;
            
            // Línea separadora
            doc.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2);
            yPosition += 5;
            
            // Datos de productos
            doc.setFont(undefined, 'normal');
            this.products.forEach((product) => {
                if (yPosition > pageHeight - 30) {
                    doc.addPage();
                    yPosition = margin;
                }
                
                const categoryInfo = this.getCategoryInfo(product.category);
                const productTotal = product.price * product.quantity;
                
                xPosition = margin;
                const rowData = [
                    product.code,
                    product.name.length > 25 ? product.name.substring(0, 22) + '...' : product.name,
                    categoryInfo.name.replace(/[^\w\s]/gi, ''),
                    `$${product.price.toFixed(2)}`,
                    product.quantity.toString(),
                    `$${productTotal.toFixed(2)}`
                ];
                
                rowData.forEach((data, index) => {
                    doc.text(data, xPosition, yPosition);
                    xPosition += colWidths[index];
                });
                yPosition += 7;
            });
            
            // Historial de reducciones
            if (this.reductionHistory.length > 0) {
                yPosition += 20;
                
                // Nueva página si no hay espacio suficiente
                if (yPosition > pageHeight - 100) {
                    doc.addPage();
                    yPosition = margin;
                }
                
                doc.setFontSize(14);
                doc.setFont(undefined, 'bold');
                doc.text('HISTORIAL DE REDUCCIONES', margin, yPosition);
                yPosition += 15;
                
                // Encabezados del historial
                doc.setFontSize(9);
                doc.setFont(undefined, 'bold');
                const historyHeaders = ['Fecha/Hora', 'Producto', 'Cant.', 'Motivo'];
                const historyColWidths = [35, 70, 20, 60];
                xPosition = margin;
                
                historyHeaders.forEach((header, index) => {
                    doc.text(header, xPosition, yPosition);
                    xPosition += historyColWidths[index];
                });
                yPosition += 8;
                
                // Línea separadora
                doc.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2);
                yPosition += 5;
                
                // Datos del historial (ordenados por fecha, más recientes primero)
                doc.setFont(undefined, 'normal');
                const sortedHistory = [...this.reductionHistory].sort((a, b) => b.timestamp - a.timestamp);
                
                sortedHistory.forEach((record) => {
                    if (yPosition > pageHeight - 20) {
                        doc.addPage();
                        yPosition = margin;
                    }
                    
                    const recordDate = new Date(record.date);
                    const dateTimeStr = recordDate.toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    xPosition = margin;
                    const historyRowData = [
                        dateTimeStr,
                        record.productName.length > 30 ? record.productName.substring(0, 27) + '...' : record.productName,
                        `-${record.quantityReduced}`,
                        record.reason.length > 25 ? record.reason.substring(0, 22) + '...' : record.reason
                    ];
                    
                    historyRowData.forEach((data, index) => {
                        doc.text(data, xPosition, yPosition);
                        xPosition += historyColWidths[index];
                    });
                    yPosition += 6;
                    
                    // Agregar notas si existen
                    if (record.notes && record.notes.trim()) {
                        doc.setFontSize(8);
                        doc.setTextColor(100, 100, 100);
                        doc.text(`Nota: ${record.notes.substring(0, 80)}`, margin + 5, yPosition);
                        yPosition += 5;
                        doc.setFontSize(9);
                        doc.setTextColor(0, 0, 0);
                    }
                });
                
                yPosition += 10;
                doc.setFontSize(10);
                doc.setFont(undefined, 'italic');
                doc.text(`Total de reducciones registradas: ${this.reductionHistory.length}`, margin, yPosition);
            }
            
            // Guardar el PDF
            const fileName = `reporte_inventario_${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}.pdf`;
            doc.save(fileName);
            
            this.showNotification('✅ Reporte PDF generado exitosamente', 'success');
            
        } catch (error) {
            console.error('Error generando reporte:', error);
            this.showNotification('❌ Error al generar el reporte PDF', 'error');
        }
    }

    exportInventory() {
        if (this.products.length === 0) {
            this.showNotification('⚠️ No hay productos para exportar', 'warning');
            return;
        }

        try {
            // Verificar que jsPDF esté disponible
            if (typeof window.jspdf === 'undefined') {
                this.showNotification('❌ Error: Librería PDF no disponible', 'error');
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            const pageWidth = doc.internal.pageSize.width;
            let yPosition = 20;
            
            // Título del archivo de exportación
            doc.setFontSize(18);
            doc.setFont(undefined, 'bold');
            doc.text('EXPORTACIÓN DE INVENTARIO', pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 10;
            
            // Subtítulo
            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            doc.text('Archivo de respaldo para importación', pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 15;
            
            // Fecha y hora de exportación
            const now = new Date();
            const dateStr = now.toISOString();
            doc.setFontSize(10);
            doc.text(`Fecha de exportación: ${dateStr}`, pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 10;
            doc.text(`Total de productos: ${this.products.length}`, pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 20;
            
            // Datos en formato JSON embebido
            const exportData = {
                exportDate: dateStr,
                version: '2.0',
                format: 'PDF_EXPORT',
                totalProducts: this.products.length,
                products: this.products,
                reductionHistory: this.reductionHistory
            };
            
            // Insertar los datos JSON de manera estructurada
            const dataString = JSON.stringify(exportData, null, 0);
            
            // Agregar marcadores especiales
            doc.setFontSize(6);
            doc.setTextColor(255, 255, 255); // Texto blanco (invisible)
            doc.text('DATA_START', 20, yPosition);
            yPosition += 3;
            
            // Insertar los datos JSON
            doc.setFontSize(1);
            doc.text(dataString, 20, yPosition);
            yPosition += 5;
            
            doc.text('DATA_END', 20, yPosition);
            doc.setTextColor(0, 0, 0); // Volver a texto negro
            
            // Nueva página para la vista legible
            doc.addPage();
            yPosition = 20;
            
            // Título de la vista legible
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('VISTA LEGIBLE DEL INVENTARIO', pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 20;
            
            // Estadísticas generales
            const totalItems = this.products.reduce((sum, product) => sum + product.quantity, 0);
            const totalValue = this.products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
            
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('RESUMEN:', 20, yPosition);
            yPosition += 10;
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`Productos únicos: ${this.products.length}`, 20, yPosition);
            yPosition += 7;
            doc.text(`Total de items: ${totalItems}`, 20, yPosition);
            yPosition += 7;
            doc.text(`Valor total: $${totalValue.toFixed(2)}`, 20, yPosition);
            yPosition += 15;
            
            // Lista de productos
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('PRODUCTOS:', 20, yPosition);
            yPosition += 15;
            
            // Tabla de productos (simplificada)
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            doc.text('Código', 20, yPosition);
            doc.text('Nombre', 50, yPosition);
            doc.text('Precio', 120, yPosition);
            doc.text('Cantidad', 150, yPosition);
            doc.text('Total', 180, yPosition);
            yPosition += 8;
            
            doc.line(20, yPosition - 2, pageWidth - 20, yPosition - 2);
            yPosition += 5;
            
            doc.setFont(undefined, 'normal');
            this.products.forEach((product) => {
                if (yPosition > 270) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                const productTotal = product.price * product.quantity;
                
                doc.text(product.code, 20, yPosition);
                doc.text(product.name.length > 30 ? product.name.substring(0, 27) + '...' : product.name, 50, yPosition);
                doc.text(`$${product.price.toFixed(2)}`, 120, yPosition);
                doc.text(product.quantity.toString(), 150, yPosition);
                doc.text(`$${productTotal.toFixed(2)}`, 180, yPosition);
                yPosition += 7;
            });
            
            // Guardar el PDF de exportación
            const fileName = `inventario_export_${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}.pdf`;
            doc.save(fileName);
            
            this.showNotification('✅ Inventario exportado a PDF exitosamente', 'success');
            
        } catch (error) {
            console.error('Error exportando inventario:', error);
            this.showNotification('❌ Error al exportar el inventario', 'error');
        }
    }

    async importInventory(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (file.type !== 'application/pdf') {
            this.showNotification('❌ Por favor selecciona un archivo PDF válido', 'error');
            event.target.value = '';
            return;
        }
        
        this.showNotification('📄 Procesando archivo PDF...', 'info');
        
        try {
            // Verificar que PDFLib esté disponible
            if (typeof PDFLib === 'undefined') {
                throw new Error('La librería PDF-lib no está cargada');
            }

            const arrayBuffer = await file.arrayBuffer();
            const { PDFDocument } = PDFLib;
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            
            const pages = pdfDoc.getPages();
            if (pages.length === 0) {
                throw new Error('El archivo PDF está vacío');
            }
            
            // Extraer texto del PDF
            const pdfText = await this.extractTextFromPDF(arrayBuffer);
            
            // Buscar los datos JSON
            let importData;
            try {
                const dataStartIndex = pdfText.indexOf('DATA_START');
                const dataEndIndex = pdfText.indexOf('DATA_END');
                
                if (dataStartIndex !== -1 && dataEndIndex !== -1) {
                    const jsonText = pdfText.substring(dataStartIndex + 10, dataEndIndex).trim();
                    importData = JSON.parse(jsonText);
                } else {
                    // Fallback: buscar por patrón JSON
                    const jsonMatch = pdfText.match(/\{.*"format":"PDF_EXPORT".*\}/s);
                    if (!jsonMatch) {
                        throw new Error('No se encontraron datos de inventario válidos en el PDF');
                    }
                    importData = JSON.parse(jsonMatch[0]);
                }
            } catch (parseError) {
                throw new Error('Los datos del archivo están corruptos o no son válidos');
            }
            
            // Validar estructura
            if (!importData.products || !Array.isArray(importData.products)) {
                throw new Error('Formato de archivo inválido');
            }
            
            if (importData.format !== 'PDF_EXPORT') {
                throw new Error('El archivo PDF no es un archivo de exportación válido');
            }
            
            // Validar campos requeridos
            const requiredFields = ['id', 'name', 'code', 'price', 'quantity', 'category'];
            const isValidData = importData.products.every(product => 
                requiredFields.every(field => product.hasOwnProperty(field))
            );
            
            if (!isValidData) {
                throw new Error('Los datos del archivo no tienen el formato correcto');
            }
            
            // Mostrar preview
            const previewMessage = `Se encontraron ${importData.products.length} productos:\n\n` +
                importData.products.slice(0, 5).map(p => `• ${p.name} - $${p.price} (${p.quantity} unidades)`).join('\n') +
                (importData.products.length > 5 ? `\n... y ${importData.products.length - 5} productos más` : '');
            
            // Confirmar importación
            const confirmImport = confirm(
                `${previewMessage}\n\n¿Estás seguro de que deseas importar estos productos?\n\n` +
                'Esta acción reemplazará todos los productos actuales en el inventario.'
            );
            
            if (confirmImport) {
                // Realizar la importación
                this.products = importData.products.map(product => ({
                    ...product,
                    price: parseFloat(product.price),
                    quantity: parseInt(product.quantity)
                }));
                
                // Importar historial de reducciones si existe
                if (importData.reductionHistory && Array.isArray(importData.reductionHistory)) {
                    this.reductionHistory = importData.reductionHistory;
                } else {
                    this.reductionHistory = [];
                }
                
                this.markUnsavedChanges();
                
                // Actualizar la interfaz en tiempo real
                this.renderProducts();
                this.updateStats();
                
                // Mostrar notificación de éxito
                const totalItems = this.products.reduce((sum, p) => sum + p.quantity, 0);
                const totalValue = this.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
                const reductionsCount = this.reductionHistory.length;
                
                this.showNotification(
                    `✅ Inventario importado exitosamente!\n📦 ${importData.products.length} productos únicos\n📊 ${totalItems} items totales\n💰 Valor total: $${totalValue.toFixed(2)}\n📋 ${reductionsCount} registros de reducciones`,
                    'success'
                );
                
                // Scroll al inventario
                setTimeout(() => {
                    const inventorySection = document.querySelector('.inventory-panel');
                    if (inventorySection) {
                        inventorySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 500);
            }
            
        } catch (error) {
            console.error('Error importando inventario:', error);
            this.showNotification(`❌ Error al importar: ${error.message}`, 'error');
        }
        
        event.target.value = '';
    }

    async extractTextFromPDF(arrayBuffer) {
        try {
            const uint8Array = new Uint8Array(arrayBuffer);
            const fullText = String.fromCharCode.apply(null, uint8Array);
            
            // Buscar marcadores DATA_START y DATA_END
            const startMarker = 'DATA_START';
            const endMarker = 'DATA_END';
            
            const startIndex = fullText.indexOf(startMarker);
            const endIndex = fullText.indexOf(endMarker);
            
            if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
                let extractedText = fullText.substring(startIndex + startMarker.length, endIndex);
                extractedText = extractedText.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();
                
                if (extractedText.includes('"format":"PDF_EXPORT"')) {
                    return extractedText;
                }
            }
            
            // Fallback: buscar patrones JSON directamente
            const jsonPattern = /\{"exportDate".*?"format":"PDF_EXPORT".*?\}/gs;
            const matches = fullText.match(jsonPattern);
            if (matches && matches.length > 0) {
                return matches[0].replace(/[\x00-\x1F\x7F-\x9F]/g, '');
            }
            
            throw new Error('No se encontraron datos de inventario válidos');
            
        } catch (error) {
            throw new Error('Error al procesar el archivo PDF: ' + error.message);
        }
    }

    showNotification(message, type = 'info') {
        if (!this.notificationsContainer) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        const titles = {
            success: 'Éxito',
            error: 'Error',
            warning: 'Advertencia',
            info: 'Información'
        };
        
        // Convertir saltos de línea a <br>
        const formattedMessage = message.replace(/\n/g, '<br>');
        
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="${icons[type] || icons.info}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${titles[type] || titles.info}</div>
                <div class="notification-message">${formattedMessage}</div>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        this.notificationsContainer.appendChild(notification);
        
        // Auto-remove
        const autoRemoveTime = message.length > 100 ? 8000 : 5000;
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideInRight 0.3s ease reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, autoRemoveTime);
    }
}

// Inicializar el sistema cuando se carga la página
let inventory;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado, inicializando inventario...');
    
    // Verificar que las librerías estén cargadas
    console.log('jsPDF disponible:', typeof window.jspdf !== 'undefined');
    console.log('PDFLib disponible:', typeof PDFLib !== 'undefined');
    
    try {
        inventory = new InventoryManager();
        console.log('Sistema de inventario inicializado exitosamente');
        
        // Mostrar notificación de bienvenida
        setTimeout(() => {
            if (inventory && inventory.showNotification) {
                inventory.showNotification('🎉 Sistema de inventario cargado correctamente', 'success');
            }
        }, 1000);
        
    } catch (error) {
        console.error('Error inicializando el sistema:', error);
        alert('Error inicializando el sistema: ' + error.message);
    }
});
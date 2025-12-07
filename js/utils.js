
// 工具函数集合

// 创建卡牌图片元素
function createCardImage(card, className) {
    const img = document.createElement('img');
    const cardClass = card.class || className;
    const imagePath = `images/${cardClass}/${card.name}.png`;
    
    img.src = imagePath;
    img.alt = card.name;
    img.className = 'card-image';
    
    img.onerror = function() {
        console.warn(`卡牌图片加载失败: ${imagePath}`);
        this.style.backgroundColor = '#333355';
    };
    
    return img;
}

// 创建选择卡牌元素（已移动到game.js，这里保留原始版本用于其他地方）
function createSelectionCardElement(card, container, className) {
    const cardElement = document.createElement('div');
    cardElement.className = 'selection-card';
    
    const img = createCardImage(card, className);
    cardElement.appendChild(img);
    
    container.appendChild(cardElement);
}

// 获取随机卡牌（添加同名卡限制：最多3张）
function getRandomCard(requiredRarity, selectedClass, cardPool, currentDeck = []) {
    let actualRarity;
    if (requiredRarity === "金及以上") {
        actualRarity = Math.random() < 0.6 ? "金" : "虹";
    } else {
        actualRarity = requiredRarity;
    }
    
    const isNeutral = Math.random() < 0.08;
    
    let pool;
    if (isNeutral) {
        pool = cardPool["中立"].filter(card => card.rarity === actualRarity);
        if (pool.length === 0) {
            pool = cardPool[selectedClass].filter(card => card.rarity === actualRarity);
        }
    } else {
        pool = cardPool[selectedClass].filter(card => card.rarity === actualRarity);
    }
    
    if (pool.length === 0) {
        pool = cardPool[selectedClass];
    }
    
    // 计算当前卡组中每张卡的数量
    const cardCounts = {};
    currentDeck.forEach(card => {
        const key = `${card.name}|${card.class || selectedClass}`;
        cardCounts[key] = (cardCounts[key] || 0) + 1;
    });
    
    // 过滤掉已经达到3张的卡牌
    const availablePool = pool.filter(card => {
        const cardClass = isNeutral ? "中立" : selectedClass;
        const key = `${card.name}|${cardClass}`;
        return (cardCounts[key] || 0) < 3;
    });
    
    // 如果可用卡池为空，则使用原始卡池
    const finalPool = availablePool.length > 0 ? availablePool : pool;
    
    let randomCard;
    let attempts = 0;
    const maxAttempts = 50; // 防止无限循环
    
    do {
        randomCard = {...finalPool[Math.floor(Math.random() * finalPool.length)]};
        randomCard.class = isNeutral ? "中立" : selectedClass;
        attempts++;
        
        // 如果尝试次数过多，直接返回当前卡牌
        if (attempts >= maxAttempts) {
            break;
        }
    } while ((cardCounts[`${randomCard.name}|${randomCard.class}`] || 0) >= 3);
    
    return randomCard;
}

// 根据刷新概率获取随机卡牌（添加同名卡限制：最多3张）
function getRandomCardByRefresh(selectedClass, cardPool, currentDeck = []) {
    const refreshRarities = ["铜", "银", "金", "虹"];
    const refreshProbabilities = [15, 20, 30, 35];
    
    const total = refreshProbabilities.reduce((sum, prob) => sum + prob, 0);
    let random = Math.random() * total;
    let selectedRarity;
    
    for (let i = 0; i < refreshRarities.length; i++) {
        if (random < refreshProbabilities[i]) {
            selectedRarity = refreshRarities[i];
            break;
        }
        random -= refreshProbabilities[i];
    }
    
    const isNeutral = Math.random() < 0.08;
    
    let pool;
    if (isNeutral) {
        pool = cardPool["中立"].filter(card => card.rarity === selectedRarity);
        if (pool.length === 0) {
            pool = cardPool[selectedClass].filter(card => card.rarity === selectedRarity);
        }
    } else {
        pool = cardPool[selectedClass].filter(card => card.rarity === selectedRarity);
    }
    
    if (pool.length === 0) {
        pool = cardPool[selectedClass];
    }
    
    // 计算当前卡组中每张卡的数量
    const cardCounts = {};
    currentDeck.forEach(card => {
        const key = `${card.name}|${card.class || selectedClass}`;
        cardCounts[key] = (cardCounts[key] || 0) + 1;
    });
    
    // 过滤掉已经达到3张的卡牌
    const availablePool = pool.filter(card => {
        const cardClass = isNeutral ? "中立" : selectedClass;
        const key = `${card.name}|${cardClass}`;
        return (cardCounts[key] || 0) < 3;
    });
    
    // 如果可用卡池为空，则使用原始卡池
    const finalPool = availablePool.length > 0 ? availablePool : pool;
    
    let randomCard;
    let attempts = 0;
    const maxAttempts = 50; // 防止无限循环
    
    do {
        randomCard = {...finalPool[Math.floor(Math.random() * finalPool.length)]};
        randomCard.class = isNeutral ? "中立" : selectedClass;
        attempts++;
        
        // 如果尝试次数过多，直接返回当前卡牌
        if (attempts >= maxAttempts) {
            break;
        }
    } while ((cardCounts[`${randomCard.name}|${randomCard.class}`] || 0) >= 3);
    
    return randomCard;
}

// 为特定职业生成封面卡牌
function generateCoverCardsForClass(className, cardPool) {
    const classCards = cardPool[className];
    const legendaryCards = classCards.filter(card => card.rarity === "虹");
    const goldCards = classCards.filter(card => card.rarity === "金");
    
    const randomLegendary = legendaryCards[Math.floor(Math.random() * legendaryCards.length)];
    const goldOrLegendaryCards = [...goldCards, ...legendaryCards];
    let randomGoldOrLegendary;
    
    do {
        randomGoldOrLegendary = goldOrLegendaryCards[Math.floor(Math.random() * goldOrLegendaryCards.length)];
    } while (randomGoldOrLegendary.name === randomLegendary.name);
    
    // 为封面卡牌添加class属性，确保它们能被正确统计
    randomLegendary.class = className;
    randomGoldOrLegendary.class = className;
    
    return [randomLegendary, randomGoldOrLegendary];
}

// 显示卡组（通用函数，用于模态框和完成界面）
function displayDeck(deck, selectedClass, container, isModal = false) {
    container.innerHTML = '';
    
    // 修复卡牌计数：使用卡牌名和class作为唯一标识
    const cardsByCost = {};
    deck.forEach(card => {
        const cost = card.cost || 0;
        const cardClass = card.class || selectedClass;
        const cardName = card.name;
        const key = `${cardName}|${cardClass}`; // 使用名称和职业作为唯一键
        
        if (!cardsByCost[cost]) cardsByCost[cost] = {};
        if (!cardsByCost[cost][key]) {
            cardsByCost[cost][key] = { card: card, count: 0, cardClass: cardClass };
        }
        cardsByCost[cost][key].count++;
    });
    
    const sortedCosts = Object.keys(cardsByCost).map(Number).sort((a, b) => a - b);
    
    if (isModal) {
        // 模态框保持原来的按费用分栏显示
        const sectionClass = 'modal-cards-section';
        const titleClass = 'modal-cards-title';
        const gridClass = 'modal-cards-grid';
        const itemClass = 'modal-card-item';
        const imageClass = 'modal-card-image';
        const countClass = 'modal-card-count';
        const infoClass = 'modal-card-info';
        
        sortedCosts.forEach(cost => {
            const costSection = document.createElement('div');
            costSection.className = sectionClass;
            
            // 创建费用标题 - 使用更小的字体
            const costTitle = document.createElement('div');
            costTitle.className = titleClass;
            
            const costText = document.createElement('span');
            costText.textContent = `费用 ${cost}`;
            costText.style.fontSize = '0.9rem'; // 减小字体大小
            costText.style.opacity = '0.7'; // 降低不透明度
            costTitle.appendChild(costText);
            
            costSection.appendChild(costTitle);
            
            // 创建卡牌网格 - 使用更大的卡牌尺寸
            const cardsGrid = document.createElement('div');
            cardsGrid.className = gridClass;
            
            // 获取该费用的所有卡牌
            const cards = Object.values(cardsByCost[cost]);
            cards.sort((a, b) => a.card.name.localeCompare(b.card.name, 'zh-CN'));
            
            // 添加卡牌到网格
            cards.forEach(cardData => {
                const card = cardData.card;
                const count = cardData.count;
                const cardClass = cardData.cardClass || selectedClass;
                
                const cardElement = document.createElement('div');
                cardElement.className = itemClass;
                
                const img = document.createElement('img');
                const imagePath = `images/${cardClass}/${card.name}.png`;
                img.src = imagePath;
                img.alt = card.name;
                img.className = imageClass;
                
                img.style.width = '90px'; // 增加模态框卡牌宽度
                img.style.height = '126px'; // 按比例增加高度
                
                img.onerror = function() {
                    console.warn(`卡牌图片加载失败: ${imagePath}`);
                    this.style.backgroundColor = '#333355';
                    this.style.width = '90px';
                    this.style.height = '126px';
                };
                
                const countElement = document.createElement('div');
                countElement.className = countClass;
                countElement.textContent = `${count}`;
                
                const infoElement = document.createElement('div');
                infoElement.className = infoClass;
                infoElement.textContent = card.name.length > 8 ? card.name.substring(0, 8) + '...' : card.name;
                
                cardElement.appendChild(img);
                cardElement.appendChild(countElement);
                cardElement.appendChild(infoElement);
                
                cardsGrid.appendChild(cardElement);
            });
            
            costSection.appendChild(cardsGrid);
            container.appendChild(costSection);
        });
    } else {
        // 完成界面：不按费用分栏，所有卡牌按费用从低到高排序，从左到右从上到下排列
        // 收集所有卡牌并排序
        const allCards = [];
        sortedCosts.forEach(cost => {
            const cards = Object.values(cardsByCost[cost]);
            cards.sort((a, b) => a.card.name.localeCompare(b.card.name, 'zh-CN'));
            allCards.push(...cards);
        });
        
        // 创建一个大的网格容器 - 修复：调整卡牌尺寸和网格布局，防止出现水平滚动条
        const cardsGrid = document.createElement('div');
        cardsGrid.className = 'completion-cards-grid';
        cardsGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(95px, 1fr)); /* 减小最小宽度 */
            gap: 10px; /* 减小间隙 */
            width: 100%;
            max-height: 85vh;
            overflow-y: auto;
            overflow-x: hidden; /* 防止水平滚动 */
            padding: 12px; /* 减小内边距 */
            justify-content: center;
            background: rgba(40, 40, 80, 0.15);
            border-radius: 10px;
            box-sizing: border-box; /* 确保内边距包含在宽度内 */
        `;
        
        // 添加卡牌到网格
        allCards.forEach(cardData => {
            const card = cardData.card;
            const count = cardData.count;
            const cardClass = cardData.cardClass || selectedClass;
            
            const cardElement = document.createElement('div');
            cardElement.className = 'completion-card-item';
            cardElement.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                position: relative;
                margin: 0;
                width: 95px; /* 固定宽度 */
            `;
            
            const img = document.createElement('img');
            const imagePath = `images/${cardClass}/${card.name}.png`;
            img.src = imagePath;
            img.alt = card.name;
            img.className = 'completion-card-image';
            img.style.cssText = `
                width: 95px; /* 减小卡牌宽度 */
                height: 133px; /* 按比例减小高度 */
                object-fit: contain;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.7);
                transition: transform 0.2s, box-shadow 0.2s;
                background-color: transparent;
                border-radius: 8px;
                margin: 0;
                cursor: pointer;
            `;
            
            img.onerror = function() {
                console.warn(`卡牌图片加载失败: ${imagePath}`);
                this.style.backgroundColor = '#333355';
                this.style.width = '95px';
                this.style.height = '133px';
            };
            
            // 鼠标悬停效果
            img.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-6px) scale(1.08)';
                this.style.boxShadow = '0 12px 25px rgba(0, 0, 0, 0.9)';
                this.style.zIndex = '100';
            });
            
            img.addEventListener('mouseleave', function() {
                this.style.transform = '';
                this.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.7)';
                this.style.zIndex = '1';
            });
            
            const countElement = document.createElement('div');
            countElement.className = 'completion-card-count';
            countElement.textContent = `${count}`;
            countElement.style.cssText = `
                position: absolute;
                top: -8px;
                right: -8px;
                background: linear-gradient(135deg, #ffd700, #ffaa00);
                color: #333;
                font-weight: bold;
                padding: 2px 8px;
                border-radius: 50%;
                font-size: 0.85rem;
                min-width: 26px;
                height: 26px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
                z-index: 101;
                border: 2px solid #333;
            `;
            
            const infoElement = document.createElement('div');
            infoElement.className = 'completion-card-info';
            infoElement.textContent = card.name.length > 10 ? card.name.substring(0, 10) + '...' : card.name;
            infoElement.style.cssText = `
                font-size: 0.8rem;
                color: #fff;
                text-align: center;
                margin-top: 6px;
                max-width: 95px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                font-weight: 600;
                font-family: 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
                line-height: 1.2;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
                background: rgba(0, 0, 0, 0.3);
                padding: 3px 5px;
                border-radius: 5px;
                width: 100%;
                box-sizing: border-box;
            `;
            
            cardElement.appendChild(img);
            cardElement.appendChild(countElement);
            cardElement.appendChild(infoElement);
            
            cardsGrid.appendChild(cardElement);
        });
        
        container.appendChild(cardsGrid);
    }
}

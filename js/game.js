
// 游戏主逻辑

// 创建卡牌图片元素（本地版本，确保可用）
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

// 游戏状态
const gameState = {
    currentScreen: "cover",
    selectedClass: "妖精",
    deck: [],
    selectionRound: 0,
    selectedSide: null,
    currentLeftCards: [],
    currentRightCards: [],
    classIndex: 0,
    coverCardsByClass: {},
    refreshCounts: {...GAME_CONFIG.refreshCounts},
    isAnimating: false, // 添加动画状态标志
    isDeckAnimating: false, // 添加组卡界面动画状态标志
    isPageTransitioning: false // 添加页面切换状态标志
};

// DOM元素
let coverScreen, selectionScreen, deckbuildingScreen, startPrompt;
let prevClassBtn, nextClassBtn, className, refreshCount, selectClassButton;
let deckCount, progressBar, currentRefreshCount, refreshButton, confirmButton;
let viewDeckButton, restartButton, currentClassName, roundInfo;
let leftSide, rightSide, leftCardsContainer, rightCardsContainer;
let deckDisplayContainer, deckDisplayContent;
let closeDeckButton, deckModal, modalDeckContent, closeModal;

// 封面卡牌元素
let coverCard1, coverCard2;

// 页面过渡遮罩层
let pageTransitionOverlay;

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    initializeDOMElements();
    
    // 创建页面过渡遮罩层
    createPageTransitionOverlay();
    
    // 初始化所有职业的封面卡牌
    initializeCoverCards();
    
    // 设置默认职业的封面卡牌
    updateCoverCards();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 初始时设置为封面模式（亮背景）
    document.body.classList.add('cover-mode');
});

// 创建页面过渡遮罩层
function createPageTransitionOverlay() {
    pageTransitionOverlay = document.createElement('div');
    pageTransitionOverlay.className = 'page-transition-overlay';
    pageTransitionOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(12, 12, 29, 1);
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
    `;
    document.body.appendChild(pageTransitionOverlay);
}

// 显示页面过渡动画
function showPageTransition(callback) {
    if (gameState.isPageTransitioning) return;
    
    gameState.isPageTransitioning = true;
    
    // 显示遮罩层
    pageTransitionOverlay.style.visibility = 'visible';
    pageTransitionOverlay.style.opacity = '1';
    
    // 等待动画完成，然后执行回调
    setTimeout(() => {
        if (callback) callback();
        
        // 淡出遮罩层
        setTimeout(() => {
            pageTransitionOverlay.style.opacity = '0';
            
            // 隐藏遮罩层
            setTimeout(() => {
                pageTransitionOverlay.style.visibility = 'hidden';
                gameState.isPageTransitioning = false;
            }, 300);
        }, 150); // 缩短等待时间
    }, 300); // 缩短总时间
}

// 获取DOM元素
function initializeDOMElements() {
    coverScreen = document.getElementById('coverScreen');
    selectionScreen = document.getElementById('selectionScreen');
    deckbuildingScreen = document.getElementById('deckbuildingScreen');
    startPrompt = document.getElementById('startPrompt');
    
    prevClassBtn = document.getElementById('prevClass');
    nextClassBtn = document.getElementById('nextClass');
    className = document.getElementById('className');
    refreshCount = document.getElementById('refreshCount');
    selectClassButton = document.getElementById('selectClassButton');
    
    // 修改按钮文本
    selectClassButton.innerHTML = '<i class="fas fa-check"></i> 选择此职业以开始。';
    
    deckCount = document.getElementById('deckCount');
    progressBar = document.getElementById('progressBar');
    currentRefreshCount = document.getElementById('currentRefreshCount');
    refreshButton = document.getElementById('refreshButton');
    confirmButton = document.getElementById('confirmButton');
    viewDeckButton = document.getElementById('viewDeckButton');
    restartButton = document.getElementById('restartButton');
    currentClassName = document.getElementById('currentClassName');
    roundInfo = document.getElementById('roundInfo');
    
    leftSide = document.getElementById('leftSide');
    rightSide = document.getElementById('rightSide');
    leftCardsContainer = document.getElementById('leftCards');
    rightCardsContainer = document.getElementById('rightCards');
    
    deckDisplayContainer = document.getElementById('deckDisplayContainer');
    deckDisplayContent = document.getElementById('deckDisplayContent');
    closeDeckButton = document.getElementById('closeDeckButton');
    
    deckModal = document.getElementById('deckModal');
    modalDeckContent = document.getElementById('modalDeckContent');
    closeModal = document.getElementById('closeModal');
    
    // 封面卡牌元素
    coverCard1 = document.getElementById('coverCard1');
    coverCard2 = document.getElementById('coverCard2');
}

// 设置事件监听器
function setupEventListeners() {
    startPrompt.addEventListener('click', function() {
        // 添加点击动画
        this.classList.add('pulse');
        setTimeout(() => {
            this.classList.remove('pulse');
            startSelection();
        }, 100); // 缩短到100ms
    });
    
    prevClassBtn.addEventListener('click', function() {
        if (gameState.isAnimating) return;
        changeClass(-1);
    });
    
    nextClassBtn.addEventListener('click', function() {
        if (gameState.isAnimating) return;
        changeClass(1);
    });
    
    selectClassButton.addEventListener('click', function() {
        // 添加点击动画
        this.classList.add('pulse');
        setTimeout(() => {
            this.classList.remove('pulse');
            selectClass();
        }, 100); // 缩短到100ms
    });
    
    leftSide.addEventListener('click', function() {
        if (gameState.isDeckAnimating) return;
        selectSide('left');
    });
    
    rightSide.addEventListener('click', function() {
        if (gameState.isDeckAnimating) return;
        selectSide('right');
    });
    
    refreshButton.addEventListener('click', function() {
        if (gameState.isDeckAnimating) return;
        refreshCards();
    });
    
    confirmButton.addEventListener('click', function() {
        if (gameState.isDeckAnimating) return;
        confirmSelection();
    });
    
    viewDeckButton.addEventListener('click', function() {
        displayModalDeck();
        deckModal.style.display = 'flex';
    });
    
    closeModal.addEventListener('click', function() {
        deckModal.style.display = 'none';
    });
    
    deckModal.addEventListener('click', function(e) {
        if (e.target === deckModal) {
            deckModal.style.display = 'none';
        }
    });
    
    closeDeckButton.addEventListener('click', function() {
        deckDisplayContainer.style.display = 'none';
    });
    
    restartButton.addEventListener('click', resetGame);
}

// 切换职业（带动画）
function changeClass(direction) {
    if (gameState.isAnimating) return;
    
    // 禁用按钮
    gameState.isAnimating = true;
    prevClassBtn.disabled = true;
    nextClassBtn.disabled = true;
    
    // 给按钮添加点击动画
    const button = direction < 0 ? prevClassBtn : nextClassBtn;
    button.classList.add('pulse');
    
    // 计算新的职业索引
    const newIndex = (gameState.classIndex + direction + GAME_CONFIG.classes.length) % GAME_CONFIG.classes.length;
    
    // 确定动画方向
    const isLeft = direction < 0;
    
    // 添加职业名字动画类
    if (isLeft) {
        className.classList.add('slide-out-right');
    } else {
        className.classList.add('slide-out-left');
    }
    
    // 添加卡牌动画类
    if (isLeft) {
        coverCard1.classList.add('slide-out-right');
        coverCard2.classList.add('slide-out-right');
    } else {
        coverCard1.classList.add('slide-out-left');
        coverCard2.classList.add('slide-out-left');
    }
    
    // 动画结束后更新内容
    setTimeout(() => {
        // 更新职业索引
        gameState.classIndex = newIndex;
        
        // 更新当前职业名字内容
        const currentClass = GAME_CONFIG.classes[gameState.classIndex];
        gameState.selectedClass = currentClass;
        className.textContent = currentClass;
        
        // 更新刷新次数
        refreshCount.textContent = `刷新次数: ${gameState.refreshCounts[currentClass]}次`;
        
        // 移除滑出动画类
        className.classList.remove('slide-out-left', 'slide-out-right');
        coverCard1.classList.remove('slide-out-left', 'slide-out-right');
        coverCard2.classList.remove('slide-out-left', 'slide-out-right');
        
        // 更新卡牌内容
        updateCoverCardsContent();
        
        // 添加滑入动画
        if (isLeft) {
            className.classList.add('slide-in-left');
            coverCard1.classList.add('slide-in-left');
            coverCard2.classList.add('slide-in-left');
        } else {
            className.classList.add('slide-in-right');
            coverCard1.classList.add('slide-in-right');
            coverCard2.classList.add('slide-in-right');
        }
        
        // 滑入动画结束后清理
        setTimeout(() => {
            // 移除所有动画类
            className.classList.remove('slide-in-left', 'slide-in-right');
            coverCard1.classList.remove('slide-in-left', 'slide-in-right');
            coverCard2.classList.remove('slide-in-left', 'slide-in-right');
            
            // 移除按钮动画类
            button.classList.remove('pulse');
            
            // 恢复按钮状态
            gameState.isAnimating = false;
            prevClassBtn.disabled = false;
            nextClassBtn.disabled = false;
        }, 150); // 缩短到150ms
    }, 150); // 缩短到150ms
}

// 初始化所有职业的封面卡牌
function initializeCoverCards() {
    GAME_CONFIG.classes.forEach(className => {
        if (!gameState.coverCardsByClass[className]) {
            gameState.coverCardsByClass[className] = generateCoverCardsForClass(className, ALL_CARDS);
        }
    });
}

// 重新生成所有职业的封面卡牌
function regenerateCoverCards() {
    gameState.coverCardsByClass = {};
    GAME_CONFIG.classes.forEach(className => {
        gameState.coverCardsByClass[className] = generateCoverCardsForClass(className, ALL_CARDS);
    });
}

// 更新封面卡牌显示
function updateCoverCards() {
    const currentClass = GAME_CONFIG.classes[gameState.classIndex];
    gameState.selectedClass = currentClass;
    
    // 更新当前职业名字
    className.textContent = currentClass;
    refreshCount.textContent = `刷新次数: ${gameState.refreshCounts[currentClass]}次`;
    
    // 更新卡牌内容
    updateCoverCardsContent();
}

// 更新封面卡牌内容（不带动画）
function updateCoverCardsContent() {
    const currentClass = gameState.selectedClass;
    const coverCards = gameState.coverCardsByClass[currentClass];
    const [coverCard1Data, coverCard2Data] = coverCards;
    
    // 更新第一张卡牌
    coverCard1.innerHTML = '';
    const img1 = createCardImage(coverCard1Data, currentClass);
    coverCard1.appendChild(img1);
    
    // 更新第二张卡牌
    coverCard2.innerHTML = '';
    const img2 = createCardImage(coverCard2Data, currentClass);
    coverCard2.appendChild(img2);
}

// 开始选择（带页面过渡动画）
function startSelection() {
    showPageTransition(() => {
        coverScreen.style.display = 'none';
        selectionScreen.style.display = 'flex';
        gameState.currentScreen = "selection";
        
        // 切换到选卡环节时移除封面模式，恢复暗背景
        document.body.classList.remove('cover-mode');
        
        // 添加进入动画
        selectionScreen.style.opacity = '0';
        selectionScreen.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            selectionScreen.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            selectionScreen.style.opacity = '1';
            selectionScreen.style.transform = 'translateY(0)';
        }, 30); // 缩短等待时间
    });
}

// 选择职业（带页面过渡动画）
function selectClass() {
    showPageTransition(() => {
        const coverCards = gameState.coverCardsByClass[gameState.selectedClass];
        gameState.deck = [...coverCards];
        
        selectionScreen.style.display = 'none';
        deckbuildingScreen.style.display = 'block';
        gameState.currentScreen = "deckbuilding";
        
        currentClassName.textContent = `${gameState.selectedClass} - 组卡`;
        currentRefreshCount.textContent = `刷新次数: ${gameState.refreshCounts[gameState.selectedClass]}次`;
        
        // 添加进入动画
        deckbuildingScreen.style.opacity = '0';
        deckbuildingScreen.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            deckbuildingScreen.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            deckbuildingScreen.style.opacity = '1';
            deckbuildingScreen.style.transform = 'translateY(0)';
        }, 30); // 缩短等待时间
        
        updateDeckInfo();
        startNextSelectionRound();
    });
}

// 开始下一轮选卡
function startNextSelectionRound() {
    if (gameState.selectionRound >= GAME_CONFIG.maxRounds) {
        showCompletion();
        return;
    }
    
    gameState.selectedSide = null;
    leftSide.classList.remove('selected');
    rightSide.classList.remove('selected');
    confirmButton.disabled = true;
    
    roundInfo.textContent = `第 ${gameState.selectionRound + 1} 轮 / 共 ${GAME_CONFIG.maxRounds} 轮`;
    
    const currentRarity = GAME_CONFIG.raritySequence[gameState.selectionRound];
    generateCardsForRound(currentRarity);
}

// 为当前轮次生成四张卡牌（初始生成，不带动画）
function generateCardsForRound(requiredRarity) {
    gameState.currentLeftCards = [];
    gameState.currentRightCards = [];
    leftCardsContainer.innerHTML = '';
    rightCardsContainer.innerHTML = '';
    
    const usedCards = new Set();
    
    for (let i = 0; i < 2; i++) {
        let leftCard;
        let attempts = 0;
        
        do {
            leftCard = getRandomCard(requiredRarity, gameState.selectedClass, ALL_CARDS);
            attempts++;
            if (attempts >= 50) break;
        } while (usedCards.has(`${leftCard.name}|${leftCard.class}`));
        
        usedCards.add(`${leftCard.name}|${leftCard.class}`);
        gameState.currentLeftCards.push(leftCard);
        createSelectionCardElement(leftCard, leftCardsContainer, gameState.selectedClass);
    }
    
    for (let i = 0; i < 2; i++) {
        let rightCard;
        let attempts = 0;
        
        do {
            rightCard = getRandomCard(requiredRarity, gameState.selectedClass, ALL_CARDS);
            attempts++;
            if (attempts >= 50) break;
        } while (usedCards.has(`${rightCard.name}|${rightCard.class}`));
        
        usedCards.add(`${rightCard.name}|${rightCard.class}`);
        gameState.currentRightCards.push(rightCard);
        createSelectionCardElement(rightCard, rightCardsContainer, gameState.selectedClass);
    }
}

// 为当前轮次生成四张卡牌（确认选择后使用，带下淡入动画）
function generateCardsForRoundWithAnimation(requiredRarity) {
    gameState.currentLeftCards = [];
    gameState.currentRightCards = [];
    
    const usedCards = new Set();
    
    // 清空容器
    leftCardsContainer.innerHTML = '';
    rightCardsContainer.innerHTML = '';
    
    // 生成新卡牌（使用淡入动画）
    for (let i = 0; i < 2; i++) {
        let leftCard;
        let attempts = 0;
        
        do {
            leftCard = getRandomCard(requiredRarity, gameState.selectedClass, ALL_CARDS);
            attempts++;
            if (attempts >= 50) break;
        } while (usedCards.has(`${leftCard.name}|${leftCard.class}`));
        
        usedCards.add(`${leftCard.name}|${leftCard.class}`);
        gameState.currentLeftCards.push(leftCard);
        createSelectionCardElementWithAnimation(leftCard, leftCardsContainer, gameState.selectedClass, true, true);
    }
    
    for (let i = 0; i < 2; i++) {
        let rightCard;
        let attempts = 0;
        
        do {
            rightCard = getRandomCard(requiredRarity, gameState.selectedClass, ALL_CARDS);
            attempts++;
            if (attempts >= 50) break;
        } while (usedCards.has(`${rightCard.name}|${rightCard.class}`));
        
        usedCards.add(`${rightCard.name}|${rightCard.class}`);
        gameState.currentRightCards.push(rightCard);
        createSelectionCardElementWithAnimation(rightCard, rightCardsContainer, gameState.selectedClass, true, false);
    }
    
    // 动画结束后恢复按钮状态
    setTimeout(() => {
        gameState.isDeckAnimating = false;
        refreshButton.disabled = false;
        confirmButton.disabled = false;
        leftSide.style.pointerEvents = 'auto';
        rightSide.style.pointerEvents = 'auto';
    }, 200); // 缩短到200ms
}

// 为当前轮次生成四张卡牌（刷新时使用，带左右滑入动画）
function generateCardsForRoundWithRefreshAnimation() {
    gameState.currentLeftCards = [];
    gameState.currentRightCards = [];
    
    const usedCards = new Set();
    
    // 清空容器
    leftCardsContainer.innerHTML = '';
    rightCardsContainer.innerHTML = '';
    
    // 生成新卡牌（使用左右滑入动画）
    for (let i = 0; i < 2; i++) {
        let leftCard;
        let attempts = 0;
        
        do {
            leftCard = getRandomCardByRefresh(gameState.selectedClass, ALL_CARDS);
            attempts++;
            if (attempts >= 50) break;
        } while (usedCards.has(`${leftCard.name}|${leftCard.class}`));
        
        usedCards.add(`${leftCard.name}|${leftCard.class}`);
        gameState.currentLeftCards.push(leftCard);
        createSelectionCardElementWithAnimation(leftCard, leftCardsContainer, gameState.selectedClass, false, true);
    }
    
    for (let i = 0; i < 2; i++) {
        let rightCard;
        let attempts = 0;
        
        do {
            rightCard = getRandomCardByRefresh(gameState.selectedClass, ALL_CARDS);
            attempts++;
            if (attempts >= 50) break;
        } while (usedCards.has(`${rightCard.name}|${rightCard.class}`));
        
        usedCards.add(`${rightCard.name}|${rightCard.class}`);
        gameState.currentRightCards.push(rightCard);
        createSelectionCardElementWithAnimation(rightCard, rightCardsContainer, gameState.selectedClass, false, false);
    }
    
    // 动画结束后恢复按钮状态
    setTimeout(() => {
        gameState.isDeckAnimating = false;
        refreshButton.disabled = false;
        confirmButton.disabled = false;
        leftSide.style.pointerEvents = 'auto';
        rightSide.style.pointerEvents = 'auto';
    }, 200); // 缩短到200ms
}

// 创建选择卡牌元素（带动画）
function createSelectionCardElementWithAnimation(card, container, className, isDownAnimation = true, isLeftSide = true) {
    const cardElement = document.createElement('div');
    cardElement.className = 'selection-card';
    
    // 设置初始状态为透明
    cardElement.style.opacity = '0';
    
    const img = createCardImage(card, className);
    cardElement.appendChild(img);
    
    container.appendChild(cardElement);
    
    // 使用requestAnimationFrame确保DOM已更新
    requestAnimationFrame(() => {
        // 添加动画类
        if (isDownAnimation) {
            cardElement.classList.add('slide-in-down');
        } else {
            if (isLeftSide) {
                cardElement.classList.add('slide-in-left-refresh');
            } else {
                cardElement.classList.add('slide-in-right-refresh');
            }
        }
        
        // 动画结束后移除动画类和内联样式
        setTimeout(() => {
            cardElement.classList.remove('slide-in-down', 'slide-in-left-refresh', 'slide-in-right-refresh');
            cardElement.style.opacity = '';
        }, 150); // 缩短到150ms
    });
}

// 创建选择卡牌元素（原函数，不带动画）
function createSelectionCardElement(card, container, className) {
    const cardElement = document.createElement('div');
    cardElement.className = 'selection-card';
    
    const img = createCardImage(card, className);
    cardElement.appendChild(img);
    
    container.appendChild(cardElement);
}

// 选择侧边
function selectSide(side) {
    if (gameState.selectedSide && gameState.selectedSide !== side) {
        if (gameState.selectedSide === 'left') {
            leftSide.classList.remove('selected');
        } else {
            rightSide.classList.remove('selected');
        }
    }
    
    gameState.selectedSide = side;
    if (side === 'left') {
        leftSide.classList.add('selected');
        rightSide.classList.remove('selected');
    } else {
        rightSide.classList.add('selected');
        leftSide.classList.remove('selected');
    }
    
    confirmButton.disabled = false;
}

// 确认选择
function confirmSelection() {
    if (!gameState.selectedSide) return;
    
    // 禁用按钮和侧边选择
    gameState.isDeckAnimating = true;
    confirmButton.disabled = true;
    refreshButton.disabled = true;
    leftSide.style.pointerEvents = 'none';
    rightSide.style.pointerEvents = 'none';
    
    // 立即更新游戏状态，不等待动画
    const selectedCards = gameState.selectedSide === 'left' 
        ? [...gameState.currentLeftCards] 
        : [...gameState.currentRightCards];
    
    gameState.deck.push(...selectedCards);
    updateDeckInfo();
    gameState.selectionRound++;
    
    // 添加按钮点击动画
    confirmButton.classList.add('pulse');
    
    // 移除按钮动画类（短暂动画）
    setTimeout(() => {
        confirmButton.classList.remove('pulse');
    }, 100); // 缩短到100ms
    
    // 如果已经完成所有轮次，立即显示完成界面
    if (gameState.selectionRound >= GAME_CONFIG.maxRounds) {
        // 短暂延迟后显示完成界面，让用户有时间看到选择反馈
        setTimeout(() => {
            gameState.isDeckAnimating = false;
            showCompletion();
        }, 150); // 缩短到150ms
        return;
    }
    
    // 立即更新轮次信息，不等待动画
    roundInfo.textContent = `第 ${gameState.selectionRound + 1} 轮 / 共 ${GAME_CONFIG.maxRounds} 轮`;
    
    // 重置选择状态
    gameState.selectedSide = null;
    leftSide.classList.remove('selected');
    rightSide.classList.remove('selected');
    
    // 立即生成新卡牌（带下淡入动画）
    const currentRarity = GAME_CONFIG.raritySequence[gameState.selectionRound];
    
    // 先清空容器，然后立即生成新卡牌
    leftCardsContainer.innerHTML = '';
    rightCardsContainer.innerHTML = '';
    
    // 使用setTimeout 0来让UI有机会更新，然后生成新卡牌
    setTimeout(() => {
        generateCardsForRoundWithAnimation(currentRarity);
    }, 0);
}

// 刷新卡牌
function refreshCards() {
    const currentClass = gameState.selectedClass;
    
    if (gameState.refreshCounts[currentClass] <= 0) {
        alert("该职业的刷新次数已用完！");
        return;
    }
    
    // 禁用按钮和侧边选择
    gameState.isDeckAnimating = true;
    refreshButton.disabled = true;
    confirmButton.disabled = true;
    leftSide.style.pointerEvents = 'none';
    rightSide.style.pointerEvents = 'none';
    
    // 添加按钮点击动画
    refreshButton.classList.add('pulse');
    
    gameState.refreshCounts[currentClass]--;
    currentRefreshCount.textContent = `刷新次数: ${gameState.refreshCounts[currentClass]}次`;
    
    // 移除按钮动画类（短暂动画）
    setTimeout(() => {
        refreshButton.classList.remove('pulse');
    }, 100); // 缩短到100ms
    
    // 重置选择状态
    gameState.selectedSide = null;
    leftSide.classList.remove('selected');
    rightSide.classList.remove('selected');
    confirmButton.disabled = true;
    
    // 立即生成新卡牌（带左右滑入动画）
    generateCardsForRoundWithRefreshAnimation();
}

// 更新卡组信息
function updateDeckInfo() {
    deckCount.textContent = gameState.deck.length;
    const progress = (gameState.deck.length / 40) * 100;
    progressBar.style.width = `${progress}%`;
    
    if (gameState.deck.length >= 40) {
        showCompletion();
    }
}

// 显示完成界面
function showCompletion() {
    roundInfo.style.display = 'none';
    document.querySelector('.selection-area').style.display = 'none';
    refreshButton.style.display = 'none';
    confirmButton.style.display = 'none';
    viewDeckButton.style.display = 'none';
    
    // 直接显示卡组
    restartButton.style.display = 'flex';
    
    displayDeck(gameState.deck, gameState.selectedClass, deckDisplayContent, false);
    deckDisplayContainer.style.display = 'block';
    
    // 修改轮次信息为完成提示
    roundInfo.style.display = 'block';
    roundInfo.textContent = '卡组构建完成！';
    roundInfo.style.color = '#ffd700';
    roundInfo.style.fontSize = '1.4rem';
    roundInfo.style.fontWeight = 'bold';
    
    setTimeout(() => {
        deckDisplayContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200); // 缩短到200ms
}

// 重置游戏（带页面过渡动画）
function resetGame() {
    showPageTransition(() => {
        gameState.deck = [];
        gameState.selectionRound = 0;
        gameState.selectedSide = null;
        gameState.currentLeftCards = [];
        gameState.currentRightCards = [];
        gameState.classIndex = 0;
        gameState.selectedClass = GAME_CONFIG.classes[0];
        gameState.refreshCounts = {...GAME_CONFIG.refreshCounts};
        gameState.isAnimating = false;
        gameState.isDeckAnimating = false;
        
        // 重新生成封面卡牌
        regenerateCoverCards();
        
        deckbuildingScreen.style.display = 'none';
        selectionScreen.style.display = 'flex';
        gameState.currentScreen = "selection";
        
        updateCoverCards();
        
        deckDisplayContainer.style.display = 'none';
        deckModal.style.display = 'none';
        
        roundInfo.style.display = 'block';
        roundInfo.textContent = `第 1 轮 / 共 ${GAME_CONFIG.maxRounds} 轮`;
        roundInfo.style.color = '#aaa';
        roundInfo.style.fontSize = '1.2rem';
        roundInfo.style.fontWeight = 'normal';
        
        document.querySelector('.selection-area').style.display = 'flex';
        refreshButton.style.display = 'flex';
        confirmButton.style.display = 'flex';
        viewDeckButton.style.display = 'flex';
        restartButton.style.display = 'none';
        
        // 恢复按钮和侧边状态
        refreshButton.disabled = false;
        confirmButton.disabled = false;
        leftSide.style.pointerEvents = 'auto';
        rightSide.style.pointerEvents = 'auto';
        
        updateDeckInfo();
        
        // 返回职业选择界面时，背景保持暗色（选卡环节的设定）
        document.body.classList.remove('cover-mode');
        
        // 添加进入动画
        selectionScreen.style.opacity = '0';
        selectionScreen.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            selectionScreen.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            selectionScreen.style.opacity = '1';
            selectionScreen.style.transform = 'translateY(0)';
        }, 30); // 缩短等待时间
    });
}

// 显示模态框卡组
function displayModalDeck() {
    displayDeck(gameState.deck, gameState.selectedClass, modalDeckContent, true);
}
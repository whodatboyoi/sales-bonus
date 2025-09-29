
/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
   const discount =  1 - (purchase.discount ?? 0) / 100;
   const salePrice = purchase.sale_price ?? 0;
   const quantity = purchase.quantity ?? 0;
   return salePrice * quantity * discount;
}


/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
  if (index === 0) {
    return seller.profit * 0.15; 
  } else if (index === 1 || index === 2) {
    return seller.profit * 0.10; 
  } else if (index === total - 1) {
    return 0;
  } else {
    return seller.profit * 0.05;
  }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    if (!data
        || !Array.isArray(data.sellers)
        || !Array.isArray(data.products)
        || !Array.isArray(data.purchase_records)
        || data.sellers.length === 0
        || data.products.length === 0
        || data.purchase_records.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    } 

    // @TODO: Проверка наличия опций

    if (!options || typeof options !== 'object') {
        throw new Error('Параметр options не передан или не является объектом');
    }

    const { calculateRevenue, calculateBonus } = options;

    if (!calculateRevenue || !calculateBonus) {
        throw new Error('Отсутствуют необходимые функции calculateRevenue или calculateBonus');
    }

    if (typeof calculateRevenue !== 'function' || typeof calculateBonus !== 'function') {
        throw new Error('calculateRevenue и calculateBonus должны быть функциями');
    }



    // @TODO: Подготовка промежуточных данных для сбора статистики

    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        fullName: `${seller.first_name ?? ""} ${seller.last_name ?? ""}`,
        startDate: seller.start_date,                 
        position: seller.position,
        sales_count: 0,
        revenue: 0,
        profit: 0,
        products_sold: {},
        bonus: 0,
        top_products: []
     })); 

    // @TODO: Индексация продавцов и товаров для быстрого доступа

    const sellerIndex = Object.fromEntries(sellerStats.map(seller => [seller.id, seller]));

    const productIndex = Object.fromEntries(data.products.map(product => [product.sku, product]));

    // @TODO: Расчет выручки и прибыли для каждого продавца

    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        if (!seller) return;

        seller.sales_count += 1;
        seller.revenue += record.total_amount ?? 0;
    
        record.items.forEach(item => {
            const product = productIndex[item.sku];
            if (!product) return;

            const quantity = item.quantity ?? 0;
            const purchasePrice = product.purchase_price ?? 0;
            const cost = purchasePrice * quantity;
            const revenue = calculateRevenue(item, product) ?? 0;
            const profit = revenue - cost;
            seller.profit += profit;
    
        if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
              }
            seller.products_sold[item.sku] += quantity;
        });
    });

    // @TODO: Сортировка продавцов по прибыли

    sellerStats.sort((a, b) => b.profit  - a.profit);

    // @TODO: Назначение премий на основе ранжирования

    const totalSellers = sellerStats.length;
    sellerStats.forEach((seller, index) => {
      seller.bonus = calculateBonus(index, totalSellers, seller);

      const top = Object.entries(seller.products_sold)
       .map(([sku, quantity]) => ({ sku, quantity }))
       .sort((a, b) => b.quantity - a.quantity)
       .slice(0, 10);
       seller.top_products = top;
    });
   
    // @TODO: Подготовка итоговой коллекции с нужными полями

    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.fullName,
        revenue: +(seller.revenue.toFixed(2)),
        profit: +(seller.profit.toFixed(2)),
        sales_count: seller.sales_count,
        top_products: (seller.top_products),
        bonus: +(seller.bonus.toFixed(2))
      }));
}

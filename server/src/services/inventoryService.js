const prisma = require('../config/prisma');

exports.getAllItems = async (category, search, low_stock) => {
  const where = {};
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { item_name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } }
    ];
  }

  const items = await prisma.inventory.findMany({
    where,
    orderBy: { item_name: 'asc' }
  });

  if (low_stock === 'true') {
    return items.filter(item => item.quantity <= item.min_stock_level);
  }
  return items;
};

exports.getItemById = async (id) => {
  return prisma.inventory.findUnique({
    where: { id: parseInt(id, 10) }
  });
};

exports.createItem = async (itemData) => {
  const {
    item_name, category, sku, quantity, min_stock_level,
    unit_price, supplier, location, description,
  } = itemData;

  const item = await prisma.inventory.create({
    data: {
      item_name,
      category,
      sku,
      quantity: quantity !== undefined ? parseInt(quantity, 10) : 0,
      min_stock_level: min_stock_level !== undefined ? parseInt(min_stock_level, 10) : 10,
      unit_price: unit_price !== undefined ? parseFloat(unit_price) : null,
      supplier,
      location,
      description
    }
  });
  return item.id;
};

exports.updateItem = async (id, itemData) => {
  const {
    item_name, category, sku, quantity, min_stock_level,
    unit_price, supplier, location, description,
  } = itemData;

  const data = {};
  if (item_name !== undefined) data.item_name = item_name;
  if (category !== undefined) data.category = category;
  if (sku !== undefined) data.sku = sku;
  if (quantity !== undefined) data.quantity = parseInt(quantity, 10);
  if (min_stock_level !== undefined) data.min_stock_level = parseInt(min_stock_level, 10);
  if (unit_price !== undefined) data.unit_price = parseFloat(unit_price);
  if (supplier !== undefined) data.supplier = supplier;
  if (location !== undefined) data.location = location;
  if (description !== undefined) data.description = description;

  try {
    await prisma.inventory.update({
      where: { id: parseInt(id, 10) },
      data
    });
    return 1;
  } catch (err) {
    return 0;
  }
};

exports.updateStock = async (id, quantity, operation) => {
  const amount = Math.abs(parseInt(quantity, 10));
  try {
    await prisma.inventory.update({
      where: { id: parseInt(id, 10) },
      data: {
        quantity: operation === 'subtract' 
          ? { decrement: amount } 
          : { increment: amount }
      }
    });
    return 1;
  } catch (err) {
    return 0;
  }
};

exports.deleteItem = async (id) => {
  try {
    await prisma.inventory.delete({ where: { id: parseInt(id, 10) } });
    return 1;
  } catch (err) {
    return 0;
  }
};

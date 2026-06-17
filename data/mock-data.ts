export const MENU_ITEMS = [
  {
    id: '1',
    name: 'Roasted Beet Salad',
    price: 9.50,
    description: 'Heirloom beets, goat cheese, walnuts, citrus vinaigrette.',
    category: 'STARTERS',
    tags: ['VEGETARIAN', 'GLUTEN-FREE'],
    allergens: ['DAIRY', 'NUTS']
  },
  {
    id: '2',
    name: 'Burrata & Tomato',
    price: 11.00,
    description: 'Creamy burrata, heritage tomatoes, basil oil, sourdough.',
    category: 'STARTERS',
    tags: ['VEGETARIAN', 'DAIRY'],
    allergens: ['GLUTEN', 'DAIRY']
  },
  {
    id: '3',
    name: 'Wild Mushroom Risotto',
    price: 17.00,
    description: 'Carnaroli rice, porcini, thyme, parmesan.',
    category: 'MAINS',
    tags: ['VEGETARIAN', 'GLUTEN-FREE'],
    allergens: ['DAIRY']
  },
  {
    id: '4',
    name: 'Pan-Seared Sea Bass',
    price: 24.00,
    description: 'Sea bass fillet, fennel, lemon butter, capers.',
    category: 'MAINS',
    tags: ['GLUTEN-FREE'],
    allergens: ['FISH', 'DAIRY']
  },
  {
    id: '5',
    name: 'Spicy Tomato Orecchiette',
    price: 16.00,
    description: 'N\'duja, chili, pecorino, fresh basil.',
    category: 'MAINS',
    tags: ['SPICY'],
    allergens: ['GLUTEN', 'DAIRY']
  },
  {
    id: '6',
    name: 'Charred Broccolini',
    price: 6.00,
    description: 'Charred broccolini, garlic, chili flakes.',
    category: 'SIDES',
    tags: ['VEGAN', 'GLUTEN-FREE', 'SPICY'],
    allergens: []
  },
  {
    id: '7',
    name: 'Truffle Fries',
    price: 7.00,
    description: 'Crispy fries, truffle oil, parmesan.',
    category: 'SIDES',
    tags: ['VEGETARIAN'],
    allergens: ['DAIRY']
  },
  {
    id: '8',
    name: 'Dark Chocolate Fondant',
    price: 8.50,
    description: 'Warm chocolate cake, vanilla ice cream.',
    category: 'DESSERTS',
    tags: ['VEGETARIAN'],
    allergens: ['GLUTEN', 'DAIRY', 'EGGS']
  },
  {
    id: '9',
    name: 'Lemon Tart',
    price: 7.50,
    description: 'Zesty lemon curd, shortcrust, meringue.',
    category: 'DESSERTS',
    tags: ['VEGETARIAN'],
    allergens: ['GLUTEN', 'DAIRY', 'EGGS']
  },
  {
    id: '10',
    name: 'Seasonal Sorbet',
    price: 6.00,
    description: 'Three scoops of seasonal fruit sorbet.',
    category: 'DESSERTS',
    tags: ['VEGAN', 'GLUTEN-FREE', 'DAIRY-FREE'],
    allergens: []
  },
  {
    id: '11',
    name: 'House Red, glass',
    price: 7.00,
    description: 'Tempranillo, Rioja, Spain.',
    category: 'DRINKS',
    tags: [],
    allergens: ['SULPHITES']
  },
  {
    id: '12',
    name: 'Sparkling Water, 0.75L',
    price: 4.00,
    description: 'Premium Italian mineral water.',
    category: 'DRINKS',
    tags: [],
    allergens: []
  }
];

export const INGREDIENTS = [
  'beets', 'goat cheese', 'walnuts', 'citrus vinaigrette',
  'burrata', 'heritage tomatoes', 'basil', 'sourdough',
  'carnaroli rice', 'porcini', 'thyme', 'parmesan',
  'sea bass', 'fennel', 'lemon', 'capers', 'butter',
  'orecchiette', 'n\'duja', 'chili', 'pecorino',
  'broccolini', 'garlic', 'potato', 'truffle oil',
  'dark chocolate', 'vanilla ice cream', 'shortcrust', 'meringue',
  'seasonal fruit', 'tempranillo', 'mineral water'
];

export const TABLES = [
  { number: 4, lastActivity: '2 min ago', hasWarning: true, warningPreview: 'Your request has been sent to the staff.', status: 'Waiting', orderId: '#A1' },
  { number: 7, lastActivity: '5 min ago', hasWarning: true, warningPreview: 'I\'ve forwarded this to a staff member to...', status: 'In progress', orderId: '#A2' },
  { number: 12, lastActivity: '10 min ago', hasWarning: false, warningPreview: 'Staff: On the way!', status: 'Resolved', orderId: null },
  { number: 2, lastActivity: '23 min ago', hasWarning: false, warningPreview: 'Welcome to Bistro Aurora, table 2.', status: null, orderId: null }
];

export const MOCK_ORDERS = {
  4: {
    id: 'A1',
    status: 'preparing' as const,
    total: 26.50,
    placedAt: new Date(Date.now() - 19 * 60000),
    updatedAt: new Date(Date.now() - 7 * 60000),
    items: [
      { menuItem: MENU_ITEMS[2], quantity: 1 }, // Wild Mushroom Risotto
      { menuItem: MENU_ITEMS[0], quantity: 1 }  // Roasted Beet Salad
    ]
  }
};

export const MOCK_CART = {
  4: [
    { menuItem: MENU_ITEMS[6], quantity: 1 } // Truffle Fries
  ]
};

export const MOCK_SERVICE_REQUESTS = {
  4: [
    { id: '1', type: 'Request bill', status: 'waiting' as const, createdAt: new Date(Date.now() - 3 * 60000) }
  ]
};

export const MOCK_CHAT_MESSAGES = [
  { id: '1', sender: 'assistant' as const, content: 'Welcome to Bistro Aurora, table 4. How can I help you today?', timestamp: new Date(Date.now() - 23 * 60000) },
  { id: '2', sender: 'user' as const, content: 'Which dishes are vegetarian and do not contain sesame?', timestamp: new Date(Date.now() - 22 * 60000) },
  { id: '3', sender: 'assistant' as const, content: 'Three dishes match: Wild Mushroom Risotto, Roasted Beet Salad, and Tomato Orecchiette. None contain sesame.', timestamp: new Date(Date.now() - 21 * 60000) },
  { id: '4', sender: 'user' as const, content: 'Can I have the bill, please?', timestamp: new Date(Date.now() - 3 * 60000) },
  { id: '5', sender: 'assistant' as const, content: 'Your request has been sent to the staff.', timestamp: new Date(Date.now() - 3 * 60000) }
];

export const SUGGESTIONS = [
  { icon: 'shield', label: 'Ask about allergens' },
  { icon: 'droplet', label: 'Ask for water' },
  { icon: 'utensils', label: 'Menu questions' }
];
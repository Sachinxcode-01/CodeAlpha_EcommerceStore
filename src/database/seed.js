const bcrypt = require('bcryptjs');
const db = require('./db');

function seedDatabase() {
  console.log('🌱 Starting database seeding for CodeAlpha E-commerce Store...');

  // 1. Seed Users (Demo Customer & Admin)
  const salt = bcrypt.genSaltSync(12);
  const customerPasswordHash = bcrypt.hashSync('Customer123!', salt);
  const adminPasswordHash = bcrypt.hashSync('Admin123!', salt);

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      name = excluded.name,
      password_hash = excluded.password_hash,
      role = excluded.role
  `);

  insertUser.run('Demo Customer', 'customer@codealpha.com', customerPasswordHash, 'customer');
  insertUser.run('Store Administrator', 'admin@codealpha.com', adminPasswordHash, 'admin');
  console.log('✅ Users seeded: customer@codealpha.com and admin@codealpha.com');

  // 2. Seed Categories
  const categories = [
    {
      name: 'Electronics & Audio',
      slug: 'electronics',
      description: 'High-fidelity audio, smart devices, and next-gen tech essentials.',
      icon: 'headphones',
      display_order: 1,
    },
    {
      name: 'Fashion & Apparel',
      slug: 'fashion',
      description: 'Minimalist, sustainable, and premium everyday wardrobe essentials.',
      icon: 'shirt',
      display_order: 2,
    },
    {
      name: 'Home & Living',
      slug: 'home-living',
      description: 'Ergonomic furniture, ambient lighting, and artisanal home goods.',
      icon: 'home',
      display_order: 3,
    },
    {
      name: 'Accessories & Travel',
      slug: 'accessories',
      description: 'Durable leather goods, modular carry bags, and daily EDC tools.',
      icon: 'briefcase',
      display_order: 4,
    },
  ];

  const insertCategory = db.prepare(`
    INSERT INTO categories (name, slug, description, icon, display_order)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      icon = excluded.icon,
      display_order = excluded.display_order
  `);

  const categoryMap = {};
  for (const cat of categories) {
    insertCategory.run(cat.name, cat.slug, cat.description, cat.icon, cat.display_order);
    const row = db.prepare('SELECT id FROM categories WHERE slug = ?').get(cat.slug);
    categoryMap[cat.slug] = row.id;
  }
  console.log('✅ Categories seeded successfully.');

  // 3. Seed Products (16 high quality products)
  const products = [
    // Electronics
    {
      category_slug: 'electronics',
      name: 'AcousticPro Wireless ANC Headphones',
      slug: 'acousticpro-wireless-anc-headphones',
      description: 'Engineered with custom 40mm beryllium drivers, active hybrid noise cancellation, 38-hour battery longevity, and plush memory foam earcups.',
      price_cents: 29999, // $299.99
      inventory: 24,
      image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
      rating: 4.9,
      rating_count: 142,
      is_featured: 1,
    },
    {
      category_slug: 'electronics',
      name: 'ClaritySound Hi-Fi Desktop Monitor Speakers',
      slug: 'claritysound-hi-fi-desktop-speakers',
      description: 'Pair of bi-amplified studio-grade studio monitors with Bluetooth 5.2 aptX-HD, optical inputs, and precision acoustic waveguides.',
      price_cents: 21950, // $219.50
      inventory: 18,
      image_url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80',
      rating: 4.8,
      rating_count: 89,
      is_featured: 1,
    },
    {
      category_slug: 'electronics',
      name: 'Chronos Mechanical Chronograph Smartwatch',
      slug: 'chronos-mechanical-smartwatch',
      description: 'Hybrid smartwatch combining genuine mechanical hands with an integrated OLED display, heart-rate tracking, sapphire crystal glass, and titanium chassis.',
      price_cents: 34900, // $349.00
      inventory: 12,
      image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
      rating: 4.7,
      rating_count: 67,
      is_featured: 1,
    },
    {
      category_slug: 'electronics',
      name: 'Lumina Ergonomic RGB Mechanical Keyboard',
      slug: 'lumina-ergonomic-mechanical-keyboard',
      description: 'Custom gasket-mounted hot-swappable keyboard with linear factory-lubed switches, sound-dampening silicone, and PBT double-shot keycaps.',
      price_cents: 15999, // $159.99
      inventory: 35,
      image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
      rating: 4.9,
      rating_count: 210,
      is_featured: 0,
    },

    // Fashion
    {
      category_slug: 'fashion',
      name: 'Artisan Wool Minimalist Overcoat',
      slug: 'artisan-wool-minimalist-overcoat',
      description: 'Tailored from 100% recycled Melton wool with a relaxed silhouette, hidden horn buttons, silk-viscose lining, and windproof storm flap.',
      price_cents: 28500, // $285.00
      inventory: 15,
      image_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80',
      rating: 4.9,
      rating_count: 53,
      is_featured: 1,
    },
    {
      category_slug: 'fashion',
      name: 'Nomad Heavyweight Organic Cotton Hoodie',
      slug: 'nomad-heavyweight-organic-hoodie',
      description: '450 GSM French terry cotton engineered with double-stitched seams, ribbed side panels, and pre-shrunk organic yarn for lifetime shape retention.',
      price_cents: 9500, // $95.00
      inventory: 40,
      image_url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
      rating: 4.7,
      rating_count: 118,
      is_featured: 0,
    },
    {
      category_slug: 'fashion',
      name: 'Vanguard Technical Weatherproof Trench',
      slug: 'vanguard-technical-weatherproof-trench',
      description: 'Three-layer waterproof breathable shell with sealed taped seams, magnetic storm closures, and structured architectural collar.',
      price_cents: 32000, // $320.00
      inventory: 10,
      image_url: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=800&auto=format&fit=crop&q=80',
      rating: 4.8,
      rating_count: 42,
      is_featured: 0,
    },
    {
      category_slug: 'fashion',
      name: 'KnitCraft Cashmere Blend Crewneck',
      slug: 'knitcraft-cashmere-blend-crewneck',
      description: 'Ultra-soft 70% Mongolian merino wool and 30% Grade-A cashmere blend offering breathable thermoregulation in a timeless silhouette.',
      price_cents: 14000, // $140.00
      inventory: 28,
      image_url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&auto=format&fit=crop&q=80',
      rating: 4.6,
      rating_count: 88,
      is_featured: 0,
    },

    // Home & Living
    {
      category_slug: 'home-living',
      name: 'AeroForm Ergonomic Desk Chair',
      slug: 'aeroform-ergonomic-desk-chair',
      description: 'Dynamic posture-correcting task chair featuring 4D adjustable armrests, adaptive lumbar contouring, and breathable woven mesh back.',
      price_cents: 44900, // $449.00
      inventory: 8,
      image_url: 'https://images.unsplash.com/photo-1580481077195-c328a37db729?w=800&auto=format&fit=crop&q=80',
      rating: 4.9,
      rating_count: 95,
      is_featured: 1,
    },
    {
      category_slug: 'home-living',
      name: 'Eclipse Matte Ceramic Pour-Over Set',
      slug: 'eclipse-matte-ceramic-pour-over-set',
      description: 'Handcrafted stoneware dripper with insulated double-wall serving carafe, heat-resistant wooden collar, and micro-mesh stainless steel filter.',
      price_cents: 6800, // $68.00
      inventory: 50,
      image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
      rating: 4.8,
      rating_count: 174,
      is_featured: 1,
    },
    {
      category_slug: 'home-living',
      name: 'Halo Ambient LED Architect Task Lamp',
      slug: 'halo-ambient-led-task-lamp',
      description: 'CNC-machined aluminum balance arm with touch-controlled dimming, 2700K to 5000K circadian color temperature tuning, and zero flicker.',
      price_cents: 12900, // $129.00
      inventory: 22,
      image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80',
      rating: 4.7,
      rating_count: 81,
      is_featured: 0,
    },
    {
      category_slug: 'home-living',
      name: 'Terra Botanica Ceramic Planter Trio',
      slug: 'terra-botanica-ceramic-planter-trio',
      description: 'Set of three self-watering matte glazed ceramic planters with hidden reservoir drainage trays and brass accent rims.',
      price_cents: 5400, // $54.00
      inventory: 30,
      image_url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&auto=format&fit=crop&q=80',
      rating: 4.9,
      rating_count: 123,
      is_featured: 0,
    },

    // Accessories & Travel
    {
      category_slug: 'accessories',
      name: 'Voyager Full-Grain Leather Weekender Bag',
      slug: 'voyager-leather-weekender-bag',
      description: 'Vegetable-tanned full grain Italian leather duffle with solid brass YKK zippers, dedicated waterproof shoe compartment, and reinforced strap.',
      price_cents: 27500, // $275.00
      inventory: 14,
      image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
      rating: 4.9,
      rating_count: 84,
      is_featured: 1,
    },
    {
      category_slug: 'accessories',
      name: 'Apex Modular Everyday Tech Backpack',
      slug: 'apex-modular-everyday-backpack',
      description: 'Cordura 1000D ballistic nylon backpack featuring weatherproof clamshell opening, padded 16-inch laptop cocoon, and magnetic fidlock buckles.',
      price_cents: 18900, // $189.00
      inventory: 25,
      image_url: 'https://images.unsplash.com/photo-1546938576-6e6a64f317cc?w=800&auto=format&fit=crop&q=80',
      rating: 4.8,
      rating_count: 162,
      is_featured: 1,
    },
    {
      category_slug: 'accessories',
      name: 'Equinox Polarized Acetate Sunglasses',
      slug: 'equinox-polarized-acetate-sunglasses',
      description: 'Hand-polished Italian Mazzucchelli acetate frames with Category 3 polarized UV400 lenses and 5-barrel German engineered hinges.',
      price_cents: 11500, // $115.00
      inventory: 32,
      image_url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80',
      rating: 4.6,
      rating_count: 73,
      is_featured: 0,
    },
    {
      category_slug: 'accessories',
      name: 'Minimalist Bifold RFID Cardholder',
      slug: 'minimalist-bifold-rfid-cardholder',
      description: 'Ultra-slim Horween Chromexcel leather wallet equipped with RFID frequency shielding, quick-access thumb pull, and bill compartment.',
      price_cents: 4800, // $48.00
      inventory: 60,
      image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80',
      rating: 4.8,
      rating_count: 219,
      is_featured: 0,
    },
  ];

  const insertProduct = db.prepare(`
    INSERT INTO products (
      category_id, name, slug, description, price_cents, inventory, image_url, rating, rating_count, is_featured
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      category_id = excluded.category_id,
      name = excluded.name,
      description = excluded.description,
      price_cents = excluded.price_cents,
      inventory = excluded.inventory,
      image_url = excluded.image_url,
      rating = excluded.rating,
      rating_count = excluded.rating_count,
      is_featured = excluded.is_featured
  `);

  for (const p of products) {
    const categoryId = categoryMap[p.category_slug];
    insertProduct.run(
      categoryId,
      p.name,
      p.slug,
      p.description,
      p.price_cents,
      p.inventory,
      p.image_url,
      p.rating,
      p.rating_count,
      p.is_featured
    );
  }

  console.log(`✅ ${products.length} Products seeded successfully across 4 categories.`);
  console.log('🎉 Seeding completed successfully!');
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;

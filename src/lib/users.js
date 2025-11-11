export async function loadUsers(withMeta = false) {
  const apiUrl = process.env.RANDOM_USER_API_URL || 'https://randomuser.me/api/?results=500';
  let fallbackUsed = false;
  
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`Random User API ${response.status}`);
    const data = await response.json();
    const users = Array.isArray(data.results) ? data.results : [];
    
    if (!users.length) {
      throw new Error('No users fetched');
    }

    // Обогащаем данными для ETL демонстрации
    const enriched = users.map((user, idx) => ({
      id: user.login?.uuid || `user-${idx}`,
      name: `${user.name?.first || ''} ${user.name?.last || ''}`.trim(),
      email: user.email || '',
      phone: user.phone || '',
      cell: user.cell || '',
      location: {
        city: user.location?.city || '',
        state: user.location?.state || '',
        country: user.location?.country || '',
        postcode: user.location?.postcode || ''
      },
      dob: user.dob?.date || '',
      age: user.dob?.age || 0,
      registered: user.registered?.date || '',
      gender: user.gender || '',
      nat: user.nat || '',
      picture: user.picture?.large || '',
      valid: true // Для ETL фильтрации
    }));

    // Берём все 500 для демонстрации ETL
    const finalUsers = enriched;
    
    if (withMeta) {
      return {
        users: finalUsers,
        fallbackUsed: false,
        sourceUrl: apiUrl,
        fetchedAt: new Date().toISOString()
      };
    }
    return finalUsers;
  } catch (error) {
    console.warn('[MiniETL] Random User API fetch failed:', error.message);
    fallbackUsed = true;
    const users = fallbackUsers();
    if (withMeta) {
      return {
        users,
        fallbackUsed: true,
        sourceUrl: apiUrl,
        fetchedAt: new Date().toISOString()
      };
    }
    return users;
  }
}

export function buildMetrics(users) {
  const total = users.length;
  const valid = users.filter((user) => user.valid && user.email).length;
  const invalid = total - valid;
  const countries = new Set(users.map(u => u.nat || u.location?.country).filter(Boolean)).size;
  const lastUser = users[users.length - 1];
  return {
    rows_in: total,
    rows_out: valid,
    dedup_removed: invalid,
    duration_sec: 95,
    lastRecord: lastUser ? lastUser.name : 'N/A',
    countries
  };
}

export function fallbackUsers() {
  return [
    {
      id: 'demo-1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-0100',
      location: { city: 'New York', country: 'US' },
      age: 30,
      valid: true
    },
    {
      id: 'demo-2',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+1-555-0101',
      location: { city: 'London', country: 'GB' },
      age: 28,
      valid: true
    },
    {
      id: 'demo-3',
      name: 'Bob Johnson',
      email: '',
      phone: '+1-555-0102',
      location: { city: 'Paris', country: 'FR' },
      age: 35,
      valid: false
    }
  ];
}


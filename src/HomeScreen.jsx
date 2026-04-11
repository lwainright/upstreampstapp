import React from 'react';
import { Screen } from './ui.jsx';

export default function HomeScreen({ agency, logoSrc }) {
return (
<Screen headerProps={{ agencyName: agency?.name, logoSrc }}>
<div style={{ color: '#dde8f4', padding: 16 }}>
Home loaded.
</div>
</Screen>
);
}

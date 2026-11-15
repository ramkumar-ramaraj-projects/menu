import { useState } from 'react'
import './index.css'
import { Menu, type MenuItem } from './components/Menu'
import { menu } from './data/menu'

function App() {
  const [selected, setSelected] = useState<string>()

  function handleSelect(item: MenuItem, trail: MenuItem[]) {
    setSelected([...trail.map((group) => group.label), item.label].join(' › '))
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-2">
      <Menu items={menu} label="Main menu" onSelect={handleSelect} />
      {selected ? <p className="text-sm text-neutral-500">Selected: {selected}</p> : null}
    </main>
  )
}

export default App

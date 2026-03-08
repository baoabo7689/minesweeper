# Minesweeper

3D cube-based Minesweeper editor built with Next.js, TypeScript, and Tailwind CSS.

## Features

- Multi-face cube board (`up`, `down`, `left`, `right`, `front`, `back`)
- Flat net view and 3D cube preview rendered side-by-side
- Cell painting modes: `Flag`, `Bomb`, `Empty`, `Undetermined`
- Cube rotation controls:
  - `LR`: rotate left/right orientation
  - `UD`: rotate up/down orientation
- Edge-linked updates between related faces (face-border propagation rules)
- Hint solver action:
  - Scans numbered cells
  - If `adjacentBombCount = flagged + undetermined`, marks undetermined neighbors as `HBomb`
  - `HBomb` is rendered as a green bomb hint and is treated as bomb evidence by the solver
  - Related edge cells are updated using the same propagation mapping as manual cell updates

## Tech Stack

- Next.js 13
- React 18
- TypeScript
- Tailwind CSS
- lucide-react (icons)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run development server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Available Scripts

- `npm run dev`: start local development server
- `npm run build`: build production bundle
- `npm run start`: run production server
- `npm run export`: export static output
- `npm run format`: format repository with Prettier
- `npm run format:check`: verify formatting
- `npm test`: placeholder test command

## Project Structure

```text
src/
	app/
		page.tsx                  # Main editor page and interaction logic
	components/
		FlattenCubeComponent.tsx  # Flat/net cube renderer
		_3DCubeComponent.tsx      # 3D cube renderer
		CellValueSelector.tsx     # Cell paint mode selector
	utilities/
		parseCubeSize.ts          # Dimension parsing helper
		rotateUtilities.ts        # LR/UD rotation utilities
		solveUtilities.ts         # HBomb hint solver helpers
```

## Notes

- The project currently focuses on board editing and solver hinting behavior.
- The `/playgame` route is scaffolded and ready for gameplay implementation.

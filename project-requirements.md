# TURNUVAYÖNETIM - Project Requirements

## Core Features
1. Tournament Clock with drift correction
2. Player Management (registration, rebuy, addon, elimination)
3. Seating & Table Balancing
4. Payout Calculator
5. League System
6. Real-time Synchronization
7. Offline-first PWA
8. Multi-display Support

## Architecture
- Event Sourcing + CQRS
- Server-authoritative clock
- WebSocket for real-time
- PostgreSQL + Redis
- Docker containerization

## Agent Orchestration
- 4 Browser Agents (Codex accounts)
- Modular task distribution
- Parallel execution
- Event-driven coordination

## Development Phases
1. Core Infrastructure (Week 1-2)
2. Tournament Features (Week 3-4)
3. Real-time & PWA (Week 5-6)
4. Testing & Deployment (Week 7-8)
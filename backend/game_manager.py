from collections import Counter

BOARD_SIZE = 10
SHIP_SIZES = (1, 2, 3, 4)
MAX_SHIPS_PER_SIZE = 5


def create_empty_board(size=BOARD_SIZE):
    return [[None for _ in range(size)] for _ in range(size)]


def check_surroundings(board, x, y):
    rows = len(board)
    cols = len(board[0])

    for dy in range(-1, 2):
        for dx in range(-1, 2):
            nx, ny = x + dx, y + dy
            if 0 <= nx < cols and 0 <= ny < rows:
                if board[ny][nx] == 'SHIP':
                    return False
    return True


def validate_ships(ships, size=BOARD_SIZE):
    board = create_empty_board(size)

    for ship in ships:
        s_len = ship['size']
        dx, dy = (1, 0) if not ship['vertical'] else (0, 1)

        can_place = True
        for i in range(s_len):
            curr_x = ship['x'] + i * dx
            curr_y = ship['y'] + i * dy

            if not (0 <= curr_x < size and 0 <= curr_y < size) or \
                    not check_surroundings(board, curr_x, curr_y):
                can_place = False
                break

        if not can_place:
            return False

        for i in range(s_len):
            curr_x = ship['x'] + i * dx
            curr_y = ship['y'] + i * dy
            board[curr_y][curr_x] = 'SHIP'

    return True


def fleet_fits(config, size=BOARD_SIZE):
    board = create_empty_board(size)
    sizes = sorted((int(s) for s, count in config.items() for _ in range(count)), reverse=True)

    def fits(x, y, length, vertical):
        dx, dy = (0, 1) if vertical else (1, 0)
        for i in range(length):
            cx, cy = x + i * dx, y + i * dy
            if not (cx < size and cy < size) or not check_surroundings(board, cx, cy):
                return False
        return True

    for length in sizes:
        spot = next(
            ((x, y, vertical) for y in range(size) for x in range(size) for vertical in (False, True) if fits(x, y, length, vertical)),
            None,
        )
        if spot is None:
            return False
        x, y, vertical = spot
        dx, dy = (0, 1) if vertical else (1, 0)
        for i in range(length):
            board[y + i * dy][x + i * dx] = 'SHIP'
    return True


def validate_config(config):
    if not isinstance(config, dict) or not config:
        return False
    if any(key not in {str(size) for size in SHIP_SIZES} for key in config):
        return False
    counts = list(config.values())
    if not all(type(count) is int and 0 <= count <= MAX_SHIPS_PER_SIZE for count in counts):
        return False
    return sum(counts) > 0 and fleet_fits(config)


def is_valid_ship(ship):
    return (
        isinstance(ship, dict)
        and ship.get('size') in SHIP_SIZES
        and type(ship.get('size')) is int
        and type(ship.get('x')) is int
        and type(ship.get('y')) is int
        and type(ship.get('vertical')) is bool
    )


def validate_fleet(ships, config):
    if not isinstance(ships, list) or not all(is_valid_ship(ship) for ship in ships):
        return False
    expected = Counter({int(size): count for size, count in config.items() if count})
    if Counter(ship['size'] for ship in ships) != expected:
        return False
    return validate_ships(ships)


def normalize_fleet(ships):
    return [{'size': s['size'], 'x': s['x'], 'y': s['y'], 'vertical': s['vertical']} for s in ships]


def is_valid_shot(shots, x, y, size=BOARD_SIZE):
    if type(x) is not int or type(y) is not int:
        return False
    if not (0 <= x < size and 0 <= y < size):
        return False
    return all((shot['x'], shot['y']) != (x, y) for shot in shots)


def check_hit(board_ships, x, y):
    for ship in board_ships:
        s_len = ship['size']
        is_vertical = ship['vertical']
        dx, dy = (1, 0) if not is_vertical else (0, 1)

        for i in range(s_len):
            sx = ship['x'] + i * dx
            sy = ship['y'] + i * dy
            if sx == x and sy == y:
                return 'hit'

    return 'miss'


def get_sunk_ships(board_ships, shots):
    sunk = []
    hit_coords = { (s['x'], s['y']) for s in shots if s['result'] == 'hit' }
    for ship in board_ships:
        s_len = ship['size']
        is_vertical = ship['vertical']
        dx, dy = (1, 0) if not is_vertical else (0, 1)

        ship_coords = set()
        for i in range(s_len):
            ship_coords.add((ship['x'] + i * dx, ship['y'] + i * dy))

        if ship_coords.issubset(hit_coords):
            sunk.append(ship)
    return sunk


def check_win(board_ships, shots):
    ship_coords = set()
    for ship in board_ships:
        s_len = ship['size']
        is_vertical = ship['vertical']
        dx, dy = (1, 0) if not is_vertical else (0, 1)

        for i in range(s_len):
            ship_coords.add((ship['x'] + i * dx, ship['y'] + i * dy))

    hit_coords = { (s['x'], s['y']) for s in shots if s['result'] == 'hit' }

    return ship_coords.issubset(hit_coords)


def reset_room_state(room_data):
    room_data['boards'] = {}
    room_data['shots'] = {sid: [] for sid in room_data['players']}
    room_data['ready'] = []
    room_data['turn'] = None
    room_data['status'] = 'waiting'
    room_data['play_again'] = set()
    return room_data
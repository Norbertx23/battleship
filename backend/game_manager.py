
def create_empty_board(size=10):
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


def validate_ships(ships, size=10):
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
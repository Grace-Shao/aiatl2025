def is_redzone(yard_line):
    if yard_line is None:
        return False
    yard_line_str = str(yard_line)
    if 'OPP' in yard_line_str:
        try:
            yardage = int(yard_line_str.replace('OPP', '').strip())
            return yardage <= 20
        except:
            return False
    return False


def get_score_differential(play):
    score_home = play.get('ScoreHome') if isinstance(play, dict) else play.ScoreHome
    score_away = play.get('ScoreAway') if isinstance(play, dict) else play.ScoreAway
    
    if score_home is not None and score_away is not None:
        return abs(score_home - score_away)
    return None


def parse_time_remaining(time_str, quarter):
    if not time_str or quarter is None:
        return None
    try:
        parts = time_str.split(':')
        if len(parts) == 2:
            minutes = int(parts[0])
            seconds = int(parts[1])
            total_seconds = minutes * 60 + seconds
            if quarter == 4:
                return total_seconds
            return None
    except:
        return None


def classify_play_category(play):
    if isinstance(play, dict):
        play_type = play.get('PlayType', '').lower()
        description = play.get('Description', '').lower()
    else:
        play_type = (play.PlayType or '').lower()
        description = (play.Description or '').lower()
    
    combined = f"{play_type} {description}"
    
    defensive_keywords = ['interception', 'fumble', 'sack', 'tackle for loss', 'safety', 
                         'forced fumble', 'fumble recovery', 'int', 'strip sack']
    special_teams_keywords = ['punt', 'kickoff', 'field goal', 'extra point', 'fg', 'pat']
    
    for keyword in defensive_keywords:
        if keyword in combined:
            return "defensive"
    
    for keyword in special_teams_keywords:
        if keyword in combined:
            return "special_teams"
    
    return "offensive"


def is_punt(play):
    if isinstance(play, dict):
        play_type = play.get('PlayType', '').lower()
        description = play.get('Description', '').lower()
    else:
        play_type = (play.PlayType or '').lower()
        description = (play.Description or '').lower()
    
    return 'punt' in play_type or 'punt' in description


def calculate_offensive_score(play_data, breakdown):
    score = 0.0
    
    down = play_data['down']
    distance = play_data['distance']
    quarter = play_data['quarter']
    yard_line = play_data['yard_line']
    yards_gained = play_data['yards_gained']
    play_type = play_data['play_type']
    description = play_data['description']
    score_diff = play_data['score_diff']
    time_remaining = play_data['time_remaining']
    
    combined_text = f"{play_type} {description}".lower()
    
    if 'touchdown' in combined_text or 'td' in play_type.lower():
        score += 50
        breakdown['touchdown'] = 50
    
    if down == 3:
        if distance is not None and distance >= 7:
            score += 20
            breakdown['third_down_long'] = 20
        elif distance is not None:
            score += 15
            breakdown['third_down'] = 15
        
        if yards_gained is not None and yards_gained >= distance:
            score += 15
            breakdown['third_down_conversion'] = 15
    
    if down == 4 and not is_punt(play_data['original_play']):
        score += 30
        breakdown['fourth_down_attempt'] = 30
        if yards_gained is not None and distance is not None and yards_gained >= distance:
            score += 20
            breakdown['fourth_down_conversion'] = 20
    
    if is_redzone(yard_line):
        score += 15
        breakdown['redzone'] = 15
    
    if yards_gained is not None:
        if yards_gained >= 25:
            score += 20
            breakdown['big_gain_25plus'] = 20
        elif yards_gained >= 15:
            score += 12
            breakdown['big_gain_15plus'] = 12
        elif yards_gained >= 10:
            score += 6
            breakdown['gain_10plus'] = 6
    
    if quarter == 4:
        score += 5
        breakdown['fourth_quarter'] = 5
        if time_remaining is not None and time_remaining <= 120:
            score += 15
            breakdown['final_two_minutes'] = 15
        
        if score_diff is not None and score_diff <= 7:
            score += 15
            breakdown['close_game'] = 15
    
    if 'field goal' in combined_text or 'fg' in combined_text:
        score += 10
        breakdown['field_goal'] = 10
        if is_redzone(yard_line):
            score += 5
            breakdown['fg_from_redzone'] = 5
    
    return score


def calculate_defensive_score(play_data, breakdown):
    score = 0.0
    
    quarter = play_data['quarter']
    play_type = play_data['play_type']
    description = play_data['description']
    score_diff = play_data['score_diff']
    time_remaining = play_data['time_remaining']
    down = play_data['down']
    yards_gained = play_data['yards_gained']
    
    combined_text = f"{play_type} {description}".lower()
    
    if 'interception' in combined_text or 'int' in combined_text:
        score += 45
        breakdown['interception'] = 45
        if 'touchdown' in combined_text:
            score += 30
            breakdown['pick_six'] = 30
    
    if 'fumble' in combined_text:
        if 'forced' in combined_text or 'recovery' in combined_text:
            score += 40
            breakdown['fumble_recovery'] = 40
            if 'touchdown' in combined_text:
                score += 30
                breakdown['fumble_td'] = 30
    
    if 'sack' in combined_text:
        score += 20
        breakdown['sack'] = 20
        if 'fumble' in combined_text:
            score += 15
            breakdown['strip_sack'] = 15
    
    if 'tackle for loss' in combined_text or 'tfl' in combined_text:
        score += 12
        breakdown['tackle_for_loss'] = 12
    
    if 'safety' in combined_text:
        score += 50
        breakdown['safety'] = 50
    
    if down == 3:
        if yards_gained is not None and yards_gained < 0:
            score += 10
            breakdown['third_down_stop_loss'] = 10
        score += 8
        breakdown['third_down_stop'] = 8
    
    if down == 4:
        score += 25
        breakdown['fourth_down_stop'] = 25
    
    if quarter == 4:
        score += 8
        breakdown['fourth_quarter'] = 8
        if time_remaining is not None and time_remaining <= 120:
            score += 20
            breakdown['final_two_minutes'] = 20
        
        if score_diff is not None and score_diff <= 7:
            score += 15
            breakdown['close_game'] = 15
    
    return score


def calculate_play_criticality_score(play):
    breakdown = {}
    
    if isinstance(play, dict):
        down = play.get('Down')
        distance = play.get('Distance')
        quarter = play.get('Quarter')
        yard_line = play.get('YardLine')
        yards_gained = play.get('YardsGained', 0)
        play_type = play.get('PlayType', '')
        description = play.get('Description', '')
        time = play.get('Time', '')
    else:
        down = play.Down
        distance = play.Distance
        quarter = play.Quarter
        yard_line = play.YardLine
        yards_gained = play.YardsGained or 0
        play_type = play.PlayType or ''
        description = play.Description or ''
        time = play.Time or ''
    
    score_diff = get_score_differential(play)
    time_remaining = parse_time_remaining(time, quarter)
    play_category = classify_play_category(play)
    
    play_data = {
        'down': down,
        'distance': distance,
        'quarter': quarter,
        'yard_line': yard_line,
        'yards_gained': yards_gained,
        'play_type': play_type,
        'description': description,
        'score_diff': score_diff,
        'time_remaining': time_remaining,
        'original_play': play
    }
    
    if play_category == "defensive":
        score = calculate_defensive_score(play_data, breakdown)
    elif play_category == "special_teams":
        score = 0.0
        if 'field goal' in (play_type + description).lower():
            score = calculate_offensive_score(play_data, breakdown)
    else:
        score = calculate_offensive_score(play_data, breakdown)
    
    return score, play_category, breakdown


def categorize_criticality(score):
    if score >= 70:
        return "CRITICAL"
    elif score >= 45:
        return "HIGH"
    elif score >= 25:
        return "MEDIUM"
    elif score >= 10:
        return "LOW"
    else:
        return "ROUTINE"


def is_key_play(score, category):
    return score >= 25 or category in ["CRITICAL", "HIGH"]


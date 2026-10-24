"""Offline CLIC seven-domain and recovery fixture probe (NOT a native restore)."""
import hashlib

DOMAINS = ('SYSTEM', 'WORK', 'TODO', 'INTERRUPTIONS', 'OBLIGATIONS', 'DAEMON', 'CONTINUATION')
TODO_STATES = {'OPEN', 'COMPLETED', 'BLOCKED', 'PAUSED', 'WAITING_EXTERNAL'}


def probe(state, prechange, restored):
    errors = []
    if not isinstance(state, dict):
        return {'result': 'CONFLICT_QUARANTINE', 'errors': ['INVALID_STATE'], 'runtime': 'NOT_TESTED'}
    if state.get('system_id') != '666CLIC':
        errors.append('IDENTITY_VIOLATION')
    if state.get('current_revision') != 91 or state.get('authority') != 'GOOGLE_DRIVE':
        errors.append('AUTHORITY_MISMATCH')
    if state.get('promotion') is not False or state.get('foreign_mutation') is not False:
        errors.append('BOUNDARY_BREACH')
    domains = state.get('domains')
    if not isinstance(domains, dict) or any(not isinstance(domains.get(x), dict) or not domains[x].get('source') for x in DOMAINS):
        errors.append('SEVEN_DOMAIN_COVERAGE_MISSING')
    todo = state.get('todo')
    if not isinstance(todo, list) or any(not isinstance(t, dict) or t.get('status') not in TODO_STATES for t in todo):
        errors.append('TODO_STATE_INVALID')
    active = state.get('active_work_id')
    known_ids = {x.get('id') for x in todo if isinstance(x, dict) and isinstance(x.get('id'), str)} if isinstance(todo, list) else set()
    if not isinstance(active, str) or active not in known_ids:
        errors.append('ACTIVE_WORK_UNREACHABLE')
    layers = state.get('temporal_layers')
    if layers != ['PRESENT_CURRENT', 'NEAR_ACTIVE_PAST', 'DEEP_HISTORICAL_PAST']:
        errors.append('LIVE_CIRCLE_LAYERS_INVALID')
    refs = state.get('reachable')
    if not isinstance(refs, list) or any(not isinstance(v, str) for v in refs) or not {'pointer', 'work', 'dev'}.issubset(set(refs)):
        errors.append('KEEP_REACHABLE_UNPROVEN')
    if state.get('historical_rev79_role') != 'HISTORICAL_ONLY' or state.get('p21_historical_closeout') != 'COMPLETE_CURRENT_SCOPE' or state.get('p21_functional') != 'OPEN':
        errors.append('SUPERSESSION_FLATTENING')
    if not isinstance(prechange, bytes) or not isinstance(restored, bytes):
        errors.append('INVALID_RESTORE_INPUT')
    elif hashlib.sha256(prechange).digest() != hashlib.sha256(restored).digest():
        errors.append('FIXTURE_RESTORE_HASH_MISMATCH')
    return {'result': 'PASS_SYNTHETIC_ONLY' if not errors else 'CONFLICT_QUARANTINE',
            'errors': errors, 'runtime': 'NOT_TESTED', 'native_restore': 'NOT_EXECUTED'}

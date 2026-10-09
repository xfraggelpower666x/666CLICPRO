"""Static CLIC whole-first rehydration ordering audit; never claims live hydration."""
REQUIRED = {
 "facets/repository_bridge/": ("FACET_CONTRACT.md","CURRENT_STATE.json","SUB_LIFECIRCLE.md","SUB_REHYDRATION.md","TRANSFER_CONTRACT.md"),
 "facets/semantic_communication_starbridge/": ("FACET_CONTRACT.md","MESSAGE_PROTOCOL.md","SUB_LIFECIRCLE.md","SUB_REHYDRATION.md"),
 "facets/junior_clic_self_reflection/": ("FACET_CONTRACT.md","SUB_LIFECIRCLE.md","SUB_REHYDRATION.md"),
 "facets/relational_memory_intelligence/": ("FACET_CONTRACT.md","RELATIONSHIP_GRAPH_CONTRACT.md","CARD_CURRENTNESS_PROTOCOL.md","SUB_LIFECIRCLE.md","SUB_REHYDRATION.md"),
}
def audit_manifest(manifest):
    order = manifest.get("required_order", []) if isinstance(manifest, dict) else []
    errors=[]
    if not isinstance(order,list) or not all(isinstance(x,str) for x in order):
        return ["INVALID_ORDER"]
    if len(order) != len(set(order)): errors.append("DUPLICATE_REFERENCES")
    if not order or order[0] != "current/REPO_NATIVE_AUTHORITY_AND_RECOVERY.md":
        errors.append("WHOLE_ROOT_NOT_FIRST")
    for prefix, names in REQUIRED.items():
        positions={name:order.index(prefix+name) for name in names if prefix+name in order}
        for name in names:
            if name not in positions: errors.append("MISSING:"+prefix+name)
        if "FACET_CONTRACT.md" in positions:
            for name, pos in positions.items():
                if name!="FACET_CONTRACT.md" and pos<positions["FACET_CONTRACT.md"]:
                    errors.append("FACET_BEFORE_CONTRACT:"+prefix+name)
    return errors

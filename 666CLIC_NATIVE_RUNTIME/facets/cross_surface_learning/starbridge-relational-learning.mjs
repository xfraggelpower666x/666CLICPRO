// CLIC-owned StarBridge relational learning; pure source validation, no transport or foreign writes.
const SHA=/^[a-f0-9]{40}$/i;
const STATES=['CANDIDATE','LEARNING','VALIDATED','INTEGRATED','REJECTED','INSUFFICIENT_DATA'];
const LINKS=['enables','blocks','depends_on','explains','contradicts','supersedes','suggested_by'];
const validName=value=>typeof value==='string'&&value.length>=2&&value.length<=128;
const unique=values=>values.length===new Set(values).size;
export function classifyPeerLearning(caseRecord={},localFeedback=null){
 const errors=[];
 if(!validName(caseRecord.case_id))errors.push('CASE_ID_REQUIRED');
 if(!['666CLIC','LYVRA'].includes(caseRecord.origin_system))errors.push('UNKNOWN_SOURCE_AUTHORITY');
 if(!SHA.test(caseRecord.source_head??''))errors.push('SOURCE_COMMIT_REQUIRED');
 if(!validName(caseRecord.source_path)||caseRecord.source_path.includes('..'))errors.push('SAFE_SOURCE_PATH_REQUIRED');
 if(!validName(caseRecord.scope))errors.push('SCOPE_REQUIRED');
 if(!Array.isArray(caseRecord.observations)||caseRecord.observations.length===0)errors.push('ACTUAL_OBSERVATION_REQUIRED');
 if(!Array.isArray(caseRecord.relations)||caseRecord.relations.length===0)errors.push('RELATION_REQUIRED');
 else for(const r of caseRecord.relations)if(!LINKS.includes(r?.type)||!validName(r?.from)||!validName(r?.to)||!validName(r?.why))errors.push('UNEXPLAINED_RELATION');
 if(!validName(caseRecord.causal_hypothesis))errors.push('CAUSAL_HYPOTHESIS_REQUIRED');
 if(!Array.isArray(caseRecord.counterevidence))errors.push('COUNTEREVIDENCE_FIELD_REQUIRED');
 if(!Array.isArray(caseRecord.solution_alternatives)||caseRecord.solution_alternatives.length<2||!unique(caseRecord.solution_alternatives))errors.push('TWO_DISTINCT_SOLUTIONS_REQUIRED');
 if(caseRecord.authority_transfer===true||caseRecord.foreign_mutation===true||caseRecord.copy_peer_memory===true)errors.push('CROSS_SYSTEM_BOUNDARY');
 if(errors.length)return {status:'BLOCKED',errors:[...new Set(errors)],source:false,delivery:false,adoption:false,host:false,mutation:false};
 const record={status:'PEER_PROPOSAL',case_id:caseRecord.case_id,origin_system:caseRecord.origin_system,local_system:caseRecord.origin_system==='666CLIC'?'LYVRA':'666CLIC',proposed_relations:caseRecord.relations,source:true,delivery:false,adoption:false,host:false,local_learning:'INSUFFICIENT_DATA',mutation:false};
 if(!localFeedback)return record;
 if(!['666CLIC','LYVRA'].includes(localFeedback.local_owner)||localFeedback.local_owner!==record.local_system||!STATES.includes(localFeedback.state))return {...record,status:'BLOCKED',reason:'LOCAL_AUTHORITY_REQUIRED'};
 if(!validName(localFeedback.outcome_evidence)||!validName(localFeedback.local_interpretation)||!Array.isArray(localFeedback.contradictions))return {...record,status:'BLOCKED',reason:'CAUSAL_OUTCOME_EVIDENCE_REQUIRED'};
 if(localFeedback.state==='INTEGRATED'&&localFeedback.independent_native_readback!==true)return {...record,status:'BLOCKED',reason:'LOCAL_NATIVE_READBACK_REQUIRED'};
 return {...record,status:'LOCALLY_ASSESSED',local_learning:localFeedback.state,local_interpretation:localFeedback.local_interpretation,contradictions:localFeedback.contradictions,outcome_evidence:localFeedback.outcome_evidence,adoption:localFeedback.state==='INTEGRATED'&&localFeedback.independent_native_readback===true};
}

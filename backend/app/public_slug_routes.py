"""Document this first-party Python module."""
from datetime import date, datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Query
from app.database import entries_collection, impact_receipts_collection, users_collection
router = APIRouter(prefix="/public", tags=["public"])
def normalize_slug(slug):
    """Handle normalize slug.

    Args:
        slug: Function argument.

    Returns:
        Function result.
    """
    return slug.strip().lower()
def parse_datetime(value):
    """Handle parse datetime.

    Args:
        value: Function argument.

    Returns:
        Function result.
    """
    if isinstance(value,datetime): return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)
    if isinstance(value,str):
        try:
            parsed=datetime.fromisoformat(value.replace("Z","+00:00")); return parsed.replace(tzinfo=timezone.utc) if parsed.tzinfo is None else parsed.astimezone(timezone.utc)
        except ValueError: return None
    return None
def parse_work_date(entry):
    """Handle parse work date.

    Args:
        entry: Function argument.

    Returns:
        Function result.
    """
    value=entry.get("entry_date")
    if isinstance(value,str) and value.strip():
        try: return date.fromisoformat(value.strip()[:10])
        except ValueError: pass
    created=parse_datetime(entry.get("created_at")); return created.date() if created else None
def serialize_entry(entry):
    """Handle serialize entry.

    Args:
        entry: Function argument.

    Returns:
        Function result.
    """
    return {"id":str(entry["_id"]),"title":entry.get("title",""),"description":entry.get("description",""),"category":entry.get("category",""),"entry_type":entry.get("entry_type",""),"entry_date":entry.get("entry_date",""),"situation":entry.get("situation",""),"action":entry.get("action",""),"impact":entry.get("impact",""),"lesson":entry.get("lesson",""),"tags":entry.get("tags",[]),"resume_bullet":entry.get("resume_bullet",""),"is_public":entry.get("is_public",False),"created_at":entry.get("created_at"),"updated_at":entry.get("updated_at")}
def serialize_public_profile(user):
    """Handle serialize public profile.

    Args:
        user: Function argument.

    Returns:
        Function result.
    """
    return {"name":user.get("name",""),"public_slug":user.get("public_slug",""),"headline":user.get("headline",""),"bio":user.get("bio",""),"location":user.get("location",""),"github_url":user.get("github_url",""),"portfolio_url":user.get("portfolio_url",""),"resume_url":user.get("resume_url",""),"profile_theme":user.get("profile_theme","default"),"profile_primary_color":user.get("profile_primary_color",""),"profile_secondary_color":user.get("profile_secondary_color",""),"profile_background_color":user.get("profile_background_color","")}
def serialize_public_impact_receipt(receipt):
    """Handle serialize public impact receipt.

    Args:
        receipt: Function argument.

    Returns:
        Function result.
    """
    evidence=[{"evidence_type":i.get("evidence_type","other"),"title":i.get("title",""),"reference":i.get("reference"),"description":i.get("description")} for i in receipt.get("evidence",[]) if i.get("is_public",False)]
    confirmed=sum(1 for c in receipt.get("confirmations",[]) if c.get("status")=="confirmed")
    return {"id":str(receipt["_id"]),"source_entry_id":receipt.get("source_entry_id",""),"accomplishment":receipt.get("accomplishment",""),"contribution":receipt.get("contribution",""),"result":receipt.get("result",""),"skills":receipt.get("skills",[]),"evidence":evidence,"trust_signals":receipt.get("trust_signals",["self-documented"]),"confirmed_count":confirmed,"created_at":receipt.get("created_at"),"updated_at":receipt.get("updated_at")}
def get_user_by_public_slug(slug):
    """Handle get user by public slug.

    Args:
        slug: Function argument.

    Returns:
        Function result.
    """
    normalized=normalize_slug(slug); user=users_collection.find_one({"$or":[{"public_slug":normalized},{"slug":normalized},{"username":normalized}]})
    if user is None: raise HTTPException(status_code=404,detail="Public profile not found")
    return user
def get_public_entry_query(slug):
    """Handle get public entry query.

    Args:
        slug: Function argument.

    Returns:
        Function result.
    """
    user=get_user_by_public_slug(slug); return {"user_id":str(user["_id"]),"is_public":True}
def get_monthly_activity(query):
    """Handle get monthly activity.

    Args:
        query: Function argument.

    Returns:
        Function result.
    """
    today=datetime.now(timezone.utc).date(); months=[]
    for offset in range(5,-1,-1):
        year=today.year; month=today.month-offset
        while month<=0: month+=12; year-=1
        months.append({"key":f"{year:04d}-{month:02d}","label":datetime(year,month,1).strftime("%b"),"count":0})
    lookup={i["key"]:i for i in months}
    for entry in entries_collection.find(query):
        work=parse_work_date(entry); key=f"{work.year:04d}-{work.month:02d}" if work else None
        if key in lookup: lookup[key]["count"]+=1
    return months
@router.get("/brag/{slug}")
def get_public_brag_entries_by_slug(slug:str,limit:int=Query(default=6,ge=1,le=50),skip:int=Query(default=0,ge=0)):
    """Handle get public brag entries by slug.

    Args:
        slug: Function argument.
        limit: Function argument.
        skip: Function argument.

    Returns:
        Function result.
    """
    query=get_public_entry_query(slug); total=entries_collection.count_documents(query); entries=[serialize_entry(e) for e in entries_collection.find(query).sort("created_at",-1).skip(skip).limit(limit)]
    return {"slug":normalize_slug(slug),"total_entries":total,"limit":limit,"skip":skip,"returned_entries":len(entries),"has_more":skip+limit<total,"activity_last_6_months":get_monthly_activity(query),"entries":entries,"message":"No public entries yet." if total==0 else "Public proof entries loaded successfully."}
@router.get("/brag/{slug}/profile")
def get_public_profile_by_slug(slug:str):
    """Handle get public profile by slug.

    Args:
        slug: Function argument.

    Returns:
        Function result.
    """
    return {"profile":serialize_public_profile(get_user_by_public_slug(slug))}
@router.get("/brag/{slug}/impact-receipts")
def get_public_impact_receipts_by_slug(slug:str):
    """Handle get public impact receipts by slug.

    Args:
        slug: Function argument.

    Returns:
        Function result.
    """
    user=get_user_by_public_slug(slug); query={"user_id":str(user["_id"]),"is_public":True}; receipts=[serialize_public_impact_receipt(r) for r in impact_receipts_collection.find(query).sort("created_at",-1)]
    return {"slug":normalize_slug(slug),"total_receipts":len(receipts),"receipts":receipts,"message":"No public Impact Receipts yet." if not receipts else "Public Impact Receipts loaded successfully."}
@router.get("/brag/{slug}/reports/weekly")
def get_public_weekly_report_by_slug(slug:str):
    """Handle get public weekly report by slug.

    Args:
        slug: Function argument.

    Returns:
        Function result.
    """
    query=get_public_entry_query(slug); today=datetime.now(timezone.utc).date(); start=today-timedelta(days=6); entries=[e for e in entries_collection.find(query) if parse_work_date(e) and start<=parse_work_date(e)<=today]; entries.sort(key=lambda e:parse_work_date(e) or date.min,reverse=True); categories={}; tags={}; bullets=[]
    for entry in entries:
        category=entry.get("category","Uncategorized"); categories[category]=categories.get(category,0)+1
        for tag in entry.get("tags",[]): tags[tag]=tags.get(tag,0)+1
        if entry.get("resume_bullet"): bullets.append(entry["resume_bullet"])
    return {"slug":normalize_slug(slug),"period":"last_7_days","date_basis":"entry_date","total_entries":len(entries),"categories":dict(sorted(categories.items(),key=lambda i:i[1],reverse=True)),"top_tags":dict(sorted(tags.items(),key=lambda i:i[1],reverse=True)),"resume_bullets":bullets,"message":"No public entries found for this week." if not entries else "Public weekly report generated successfully."}
@router.get("/brag/{slug}/tags/summary")
def get_public_tags_summary_by_slug(slug:str):
    """Handle get public tags summary by slug.

    Args:
        slug: Function argument.

    Returns:
        Function result.
    """
    counts={}
    for entry in entries_collection.find(get_public_entry_query(slug)):
        for tag in entry.get("tags",[]): counts[tag]=counts.get(tag,0)+1
    counts=dict(sorted(counts.items(),key=lambda i:i[1],reverse=True)); return {"slug":normalize_slug(slug),"total_unique_tags":len(counts),"tags":counts,"message":"No public tags found yet." if not counts else "Public tag summary generated successfully."}
@router.get("/brag/{slug}/categories/summary")
def get_public_categories_summary_by_slug(slug:str):
    """Handle get public categories summary by slug.

    Args:
        slug: Function argument.

    Returns:
        Function result.
    """
    counts={}
    for entry in entries_collection.find(get_public_entry_query(slug)):
        category=entry.get("category","Uncategorized"); counts[category]=counts.get(category,0)+1
    counts=dict(sorted(counts.items(),key=lambda i:i[1],reverse=True)); return {"slug":normalize_slug(slug),"total_unique_categories":len(counts),"categories":counts,"message":"No public categories found yet." if not counts else "Public category summary generated successfully."}

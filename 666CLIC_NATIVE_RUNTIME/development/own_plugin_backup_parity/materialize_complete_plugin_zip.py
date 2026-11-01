#!/usr/bin/env python3
"""Local-only complete backup ZIP from exact authorized original TAR.GZ.
No network, provider mutation, vault write or remote backup PASS.
"""
import hashlib
import io
import pathlib
import tarfile
import zipfile

def materialize(source_path, target_path, expected_tar_sha256):
    source_path = pathlib.Path(source_path)
    target_path = pathlib.Path(target_path)
    tar_bytes = source_path.read_bytes()
    source_sha = hashlib.sha256(tar_bytes).hexdigest()
    if source_sha != expected_tar_sha256:
        raise ValueError('source_tar_sha256_mismatch')
    content = []
    with tarfile.open(fileobj=io.BytesIO(tar_bytes), mode='r:gz') as archive:
        for member in archive.getmembers():
            if not member.isfile():
                raise ValueError('non_regular_tar_member_forbidden')
            name = member.name
            parts = pathlib.PurePosixPath(name).parts
            if name.startswith('/') or '..' in parts or '\\' in name or not name:
                raise ValueError('unsafe_tar_member_path')
            handle = archive.extractfile(member)
            if handle is None:
                raise ValueError('tar_member_unreadable')
            content.append((name, handle.read()))
    if not content or len({name for name, _ in content}) != len(content):
        raise ValueError('empty_or_duplicate_tar_entries')
    if target_path.exists():
        raise ValueError('target_exists_refuse_overwrite')
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w', compression=zipfile.ZIP_DEFLATED) as backup:
        for name, data in content:
            backup.writestr(name, data)
    expected_zip = buffer.getvalue()
    target_path.write_bytes(expected_zip)
    observed = target_path.read_bytes()
    if hashlib.sha256(observed).digest() != hashlib.sha256(expected_zip).digest():
        raise IOError('local_zip_readback_mismatch')
    with zipfile.ZipFile(io.BytesIO(observed)) as z:
        if z.testzip() is not None:
            raise IOError('zip_crc_readback_mismatch')
        for name, data in content:
            if z.read(name) != data:
                raise IOError('zip_entry_readback_mismatch')
    return {
        'status': 'LOCAL_ORIGINAL_TAR_TO_ZIP_BYTE_READBACK_PASS_NOT_REMOTE_BACKUP',
        'source_tar_sha256': source_sha,
        'zip_sha256': hashlib.sha256(observed).hexdigest(),
        'zip_bytes': len(observed),
        'entries': len(content),
        'remote_backup_readback': False,
    }

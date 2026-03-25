import os
import uuid
from typing import Optional

import boto3
from dotenv import load_dotenv

load_dotenv()

aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID")
aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY")
aws_session_token = os.getenv("AWS_SESSION_TOKEN")


def _build_boto3_kwargs(service_name: str) -> dict:
    kwargs = {
        "service_name": service_name,
        "region_name": os.getenv("AWS_REGION", "ap-south-1"),
    }
    if aws_access_key_id and aws_secret_access_key:
        kwargs["aws_access_key_id"] = aws_access_key_id
        kwargs["aws_secret_access_key"] = aws_secret_access_key
        if aws_session_token:
            kwargs["aws_session_token"] = aws_session_token
    return kwargs


def get_s3_bucket_name() -> Optional[str]:
    return os.getenv("UPLOADS_BUCKET", "").strip() or None


def get_public_s3_base_url(bucket_name: str) -> str:
    region = os.getenv("AWS_REGION", "ap-south-1")
    return f"https://{bucket_name}.s3.{region}.amazonaws.com"


def upload_file_to_s3(file_obj, filename: str, content_type: Optional[str], folder: str = "uploads") -> str:
    bucket_name = get_s3_bucket_name()
    if not bucket_name:
        raise RuntimeError("UPLOADS_BUCKET is not configured")

    ext = os.path.splitext(filename)[1].lower()
    object_key = f"{folder}/{uuid.uuid4()}{ext}"

    s3_client = boto3.client(**_build_boto3_kwargs("s3"))
    extra_args = {}
    if content_type:
        extra_args["ContentType"] = content_type

    file_obj.seek(0)
    s3_client.upload_fileobj(file_obj, bucket_name, object_key, ExtraArgs=extra_args)

    return f"{get_public_s3_base_url(bucket_name)}/{object_key}"

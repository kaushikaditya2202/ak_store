import json
import os
import random
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from decimal import Decimal

import boto3


REGION = os.getenv("AWS_REGION", "ap-south-1")
USERS_TABLE = os.getenv("USERS_TABLE", "Users")


def send_otp_email_via_smtp(email: str, otp: str) -> bool:
    smtp_host = os.getenv("SMTP_HOST", "").strip() or "smtp.gmail.com"
    smtp_user = os.getenv("SMTP_EMAIL", "").strip()
    smtp_pass = os.getenv("SMTP_PASSWORD", "").strip()
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_use_ssl = os.getenv("SMTP_USE_SSL", "false").strip().lower() == "true"
    smtp_from = os.getenv("SMTP_FROM_EMAIL", "").strip() or smtp_user

    if not smtp_user or not smtp_pass or not smtp_from:
        return False

    message = MIMEText(f"Your OTP for login is: {otp}. It is valid for 10 minutes.", "plain")
    message["Subject"] = "Your AK Store Login OTP"
    message["From"] = smtp_from
    message["To"] = email

    attempts = []
    primary_mode = "ssl" if smtp_use_ssl else "starttls"
    attempts.append((smtp_port, primary_mode))
    if (smtp_port, "starttls") not in attempts:
        attempts.append((587, "starttls"))
    if (smtp_port, "ssl") not in attempts:
        attempts.append((465, "ssl"))

    for port, mode in attempts:
        try:
            if mode == "ssl":
                with smtplib.SMTP_SSL(smtp_host, port, timeout=20) as server:
                    server.login(smtp_user, smtp_pass)
                    server.send_message(message)
            else:
                with smtplib.SMTP(smtp_host, port, timeout=20) as server:
                    server.ehlo()
                    server.starttls()
                    server.ehlo()
                    server.login(smtp_user, smtp_pass)
                    server.send_message(message)
            return True
        except Exception as exc:
            print(f"Lambda SMTP OTP send error on port {port} ({mode}): {exc}")

    return False


def store_otp(phone: str, otp: str, expiry: str) -> bool:
    try:
        table = boto3.resource("dynamodb", region_name=REGION).Table(USERS_TABLE)
        table.update_item(
            Key={"phone": phone},
            UpdateExpression="SET otp = :otp, otp_expiry = :expiry, otp_delivery_status = :status",
            ExpressionAttributeValues={
                ":otp": otp,
                ":expiry": expiry,
                ":status": "pending",
            },
        )
        return True
    except Exception as exc:
        print(f"Lambda OTP store error: {exc}")
        return False


def update_delivery_status(phone: str, status: str) -> None:
    try:
        table = boto3.resource("dynamodb", region_name=REGION).Table(USERS_TABLE)
        table.update_item(
            Key={"phone": phone},
            UpdateExpression="SET otp_delivery_status = :status",
            ExpressionAttributeValues={":status": status},
        )
    except Exception as exc:
        print(f"Lambda OTP delivery status update error: {exc}")


def _response(status_code: int, body: dict) -> dict:
    return {"statusCode": status_code, "body": json.dumps(body)}


def _parse_event_payload(event) -> dict:
    payload = event or {}
    if isinstance(payload, dict) and isinstance(payload.get("body"), str):
        try:
            body = json.loads(payload["body"])
            if isinstance(body, dict):
                return body
        except json.JSONDecodeError:
            pass
    return payload if isinstance(payload, dict) else {}


def handler(event, context):
    payload = _parse_event_payload(event)
    phone = str(payload.get("phone") or "").strip()
    email = str(payload.get("email") or "").strip()
    if not phone or not email:
        return _response(400, {"success": False, "error": "Missing phone or email"})

    otp = f"{random.randint(100000, 999999):06d}"
    expiry = (datetime.utcnow() + timedelta(minutes=10)).isoformat()

    if not store_otp(phone, otp, expiry):
        return _response(500, {"success": False, "error": "Failed to store OTP"})

    if not send_otp_email_via_smtp(email, otp):
        update_delivery_status(phone, "failed")
        return _response(200, {"success": True, "otp_stored": True, "email_sent": False, "message": "OTP generated but email delivery failed"})

    update_delivery_status(phone, "sent")
    return _response(200, {"success": True, "otp_stored": True, "email_sent": True, "message": "OTP sent"})

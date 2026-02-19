"""
Email Monitor Service for PhishGuard
Monitors email accounts via IMAP and analyzes incoming emails for phishing threats
"""

import imaplib
import email
from email.header import decode_header
from email.utils import parseaddr
import logging
import asyncio
import re
import html
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
import httpx
from email_validator import validate_email, EmailNotValidError

logger = logging.getLogger(__name__)


class EmailMonitorService:
    """Service for monitoring email accounts and analyzing incoming messages"""
    
    # IMAP server configurations
    IMAP_SERVERS = {
        'gmail': {'host': 'imap.gmail.com', 'port': 993},
        'outlook': {'host': 'outlook.office365.com', 'port': 993},
        'hotmail': {'host': 'outlook.office365.com', 'port': 993},
        'yahoo': {'host': 'imap.mail.yahoo.com', 'port': 993},
        'icloud': {'host': 'imap.mail.me.com', 'port': 993},
        'aol': {'host': 'imap.aol.com', 'port': 993},
    }
    
    def __init__(self, api_base_url: str = "http://localhost:8000"):
        """
        Initialize Email Monitor Service
        
        Args:
            api_base_url: Base URL for the PhishGuard API
        """
        self.api_base_url = api_base_url
        self.active_monitors: Dict[str, imaplib.IMAP4_SSL] = {}
        self.monitoring_tasks: Dict[str, asyncio.Task] = {}
        
    def get_imap_server(self, email_address: str) -> Dict[str, Any]:
        """
        Determine IMAP server settings based on email address
        
        Args:
            email_address: Email address to analyze
            
        Returns:
            Dictionary with host and port
        """
        domain = email_address.split('@')[1].lower()
        
        # Check for common providers
        for provider, settings in self.IMAP_SERVERS.items():
            if provider in domain:
                return settings
        
        # Default to Gmail settings (most compatible)
        return self.IMAP_SERVERS['gmail']
    
    def validate_credentials(self, email_address: str, password: str) -> Tuple[bool, Optional[str]]:
        """
        Validate email credentials by attempting IMAP connection
        
        Args:
            email_address: Email address
            password: Password or app-specific password
            
        Returns:
            Tuple of (success, error_message)
        """
        try:
            # Validate email format
            validate_email(email_address, check_deliverability=False)
            
            # Get IMAP settings
            imap_settings = self.get_imap_server(email_address)
            
            # Attempt connection
            logger.info(f"🔌 Connecting to {imap_settings['host']}...")
            mail = imaplib.IMAP4_SSL(imap_settings['host'], imap_settings['port'])
            mail.login(email_address, password)
            mail.select('INBOX', readonly=True)
            mail.logout()
            
            logger.info(f"✅ Successfully validated credentials for {email_address}")
            return True, None
            
        except EmailNotValidError as e:
            error_msg = f"Invalid email address: {str(e)}"
            logger.error(f"❌ {error_msg}")
            return False, error_msg
            
        except imaplib.IMAP4.error as e:
            error_str = str(e)
            
            # Provide specific guidance based on error
            if 'AUTHENTICATIONFAILED' in error_str or 'Invalid credentials' in error_str:
                if 'gmail' in email_address.lower():
                    error_msg = (
                        "Gmail Authentication Failed. Common solutions:\n"
                        "1. Generate App Password: https://myaccount.google.com/apppasswords\n"
                        "2. Enable 2-Factor Authentication first\n"
                        "3. Enable IMAP in Gmail Settings → Forwarding and POP/IMAP\n"
                        "4. Don't use your regular Gmail password - use the 16-character app password"
                    )
                elif 'outlook' in email_address.lower() or 'hotmail' in email_address.lower():
                    error_msg = (
                        "Outlook Authentication Failed. Common solutions:\n"
                        "1. Generate App Password: https://account.microsoft.com/security\n"
                        "2. Enable 2-Factor Authentication first\n"
                        "3. Use the app password, not your regular password"
                    )
                elif 'yahoo' in email_address.lower():
                    error_msg = (
                        "Yahoo Authentication Failed. Common solutions:\n"
                        "1. Generate App Password: https://login.yahoo.com/account/security\n"
                        "2. Enable 2-Factor Authentication first\n"
                        "3. Use the generated app password (not your regular password)"
                    )
                else:
                    error_msg = (
                        "Authentication Failed. Please check:\n"
                        "1. Enable 2-Factor Authentication on your email account\n"
                        "2. Generate an app-specific password (not your regular password)\n"
                        "3. Ensure IMAP is enabled in your email settings\n"
                        "4. Remove any spaces from the app password"
                    )
            else:
                error_msg = f"IMAP Error: {error_str}"
            
            logger.error(f"❌ {error_msg}")
            return False, error_msg
            
        except Exception as e:
            error_msg = f"Connection error: {str(e)}"
            logger.error(f"❌ {error_msg}")
            return False, error_msg
    
    def extract_email_body(self, msg: email.message.Message) -> str:
        """
        Extract email body from message object
        
        Args:
            msg: Email message object
            
        Returns:
            Extracted email body text
        """
        body = ""
        
        try:
            # Get email body
            if msg.is_multipart():
                for part in msg.walk():
                    content_type = part.get_content_type()
                    content_disposition = str(part.get("Content-Disposition"))
                    
                    # Skip attachments
                    if "attachment" in content_disposition:
                        continue
                    
                    # Get text/plain or text/html
                    if content_type == "text/plain":
                        payload = part.get_payload(decode=True)
                        if payload:
                            body = payload.decode('utf-8', errors='ignore')
                            break
                    elif content_type == "text/html" and not body:
                        payload = part.get_payload(decode=True)
                        if payload:
                            html_content = payload.decode('utf-8', errors='ignore')
                            # Strip HTML tags (basic)
                            body = re.sub('<[^<]+?>', '', html_content)
            else:
                # Not multipart
                payload = msg.get_payload(decode=True)
                if payload:
                    body = payload.decode('utf-8', errors='ignore')
            
            # Clean up body
            body = html.unescape(body)
            body = body.strip()
            
        except Exception as e:
            logger.error(f"Error extracting email body: {e}")
            body = ""
        
        return body
    
    def extract_links(self, text: str) -> List[str]:
        """
        Extract URLs from email text
        
        Args:
            text: Email body text
            
        Returns:
            List of URLs found
        """
        url_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+'
        urls = re.findall(url_pattern, text)
        return list(set(urls))  # Remove duplicates
    
    def parse_email_header(self, header_value: str) -> str:
        """
        Decode email header (handles encoded subjects and names)
        
        Args:
            header_value: Raw header value
            
        Returns:
            Decoded string
        """
        if not header_value:
            return ""
        
        decoded_parts = decode_header(header_value)
        decoded_string = ""
        
        for content, encoding in decoded_parts:
            if isinstance(content, bytes):
                try:
                    decoded_string += content.decode(encoding or 'utf-8', errors='ignore')
                except:
                    decoded_string += content.decode('utf-8', errors='ignore')
            else:
                decoded_string += str(content)
        
        return decoded_string.strip()
    
    async def analyze_email_with_api(self, email_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send email to PhishGuard API for analysis
        
        Args:
            email_data: Extracted email data
            
        Returns:
            Analysis result from API
        """
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.api_base_url}/analyze/email",
                    json={
                        "content": email_data['body'],
                        "subject": email_data['subject'],
                        "sender_email": email_data['from_email'],
                        "sender_display": email_data.get('from_name', '')
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    logger.info(f"✅ Email analyzed: {email_data['subject'][:50]}... - Phishing: {result['is_phishing']}")
                    return result
                else:
                    logger.error(f"❌ API error: {response.status_code}")
                    return None
                    
        except Exception as e:
            logger.error(f"❌ Error calling analysis API: {e}")
            return None
    
    async def fetch_and_analyze_emails(
        self, 
        user_id: str,
        email_address: str, 
        password: str, 
        callback=None
    ) -> List[Dict[str, Any]]:
        """
        Fetch recent emails and analyze them
        
        Args:
            user_id: User ID for tracking
            email_address: Email address to monitor
            password: Email password
            callback: Optional callback function for results
            
        Returns:
            List of analysis results
        """
        results = []
        
        try:
            # Get IMAP settings
            imap_settings = self.get_imap_server(email_address)
            
            # Connect to IMAP server
            logger.info(f"🔌 Connecting to mailbox: {email_address}")
            mail = imaplib.IMAP4_SSL(imap_settings['host'], imap_settings['port'])
            mail.login(email_address, password)
            mail.select('INBOX')
            
            # Search for recent emails (last 10)
            logger.info("📧 Fetching recent emails...")
            status, messages = mail.search(None, 'ALL')
            
            if status == 'OK':
                email_ids = messages[0].split()
                # Get last 10 emails (newest first)
                recent_ids = email_ids[-10:] if len(email_ids) > 10 else email_ids
                recent_ids = list(reversed(recent_ids))  # Newest emails first
                
                logger.info(f"📬 Found {len(recent_ids)} emails to analyze")
                
                for email_id in recent_ids:
                    try:
                        # Fetch email
                        status, msg_data = mail.fetch(email_id, '(RFC822)')
                        
                        if status != 'OK':
                            continue
                        
                        # Parse email
                        raw_email = msg_data[0][1]
                        msg = email.message_from_bytes(raw_email)
                        
                        # Extract email data
                        subject = self.parse_email_header(msg.get('Subject', 'No Subject'))
                        from_header = msg.get('From', '')
                        from_name, from_email = parseaddr(from_header)
                        from_name = self.parse_email_header(from_name)
                        
                        body = self.extract_email_body(msg)
                        links = self.extract_links(body)
                        
                        email_data = {
                            'subject': subject,
                            'from_name': from_name,
                            'from_email': from_email,
                            'body': body,
                            'links': links,
                            'date': msg.get('Date', ''),
                            'message_id': msg.get('Message-ID', '')
                        }
                        
                        logger.info(f"📧 Analyzing: {subject[:50]}...")
                        
                        # Analyze email
                        analysis_result = await self.analyze_email_with_api(email_data)
                        
                        if analysis_result:
                            result = {
                                'user_id': user_id,
                                'email_data': email_data,
                                'analysis': analysis_result,
                                'timestamp': datetime.now().isoformat()
                            }
                            results.append(result)
                            
                            # Call callback if provided
                            if callback:
                                await callback(result)
                    
                    except Exception as e:
                        logger.error(f"❌ Error processing email {email_id}: {e}")
                        continue
            
            # Cleanup
            mail.close()
            mail.logout()
            logger.info(f"✅ Completed analysis of {len(results)} emails")
            
        except Exception as e:
            logger.error(f"❌ Error in email monitoring: {e}")
        
        return results
    
    async def start_monitoring(
        self, 
        user_id: str,
        email_address: str, 
        password: str,
        check_interval: int = 120,  # 2 minutes
        callback=None
    ):
        """
        Start continuous email monitoring
        
        Args:
            user_id: User ID
            email_address: Email address to monitor
            password: Email password
            check_interval: Check interval in seconds (default 2 minutes)
            callback: Optional callback function to handle results
        """
        logger.info(f"🚀 Starting email monitoring for {user_id}: {email_address}")
        
        while True:
            try:
                # Fetch and analyze emails
                results = await self.fetch_and_analyze_emails(user_id, email_address, password)
                
                # Call callback with results if provided
                if callback and results:
                    for result in results:
                        await callback(result)
                
                # Wait before next check
                logger.info(f"⏰ Next check in {check_interval} seconds...")
                await asyncio.sleep(check_interval)
                
            except asyncio.CancelledError:
                logger.info(f"🛑 Monitoring stopped for {user_id}")
                break
            except Exception as e:
                logger.error(f"❌ Error in monitoring loop: {e}")
                await asyncio.sleep(60)  # Wait 1 minute before retry


# Singleton instance
email_monitor = EmailMonitorService()

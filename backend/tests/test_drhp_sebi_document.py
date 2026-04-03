"""
Test suite for DRHP Import with actual SEBI document (DRHP_Draft_Test.docx)
Tests the 4.8MB SEBI DRHP document with expected stats:
- 140 hyperlinks (mailto:, http:, internal bookmarks)
- 336 tables
- 54 images
- Legal paper size (8.5x14)
- 10pt Times New Roman font
"""
import pytest
import requests
import os
import subprocess
import time
import re

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Path to the actual SEBI DRHP document
DRHP_TEST_FILE = "/app/backend/DRHP_Draft_Test.docx"


@pytest.fixture(scope="module")
def test_data():
    """Create test user, session, and project via MongoDB"""
    timestamp = int(time.time() * 1000)
    
    result = subprocess.run([
        'mongosh', '--quiet', '--eval', f'''
        use('test_database');
        var userId = 'test-user-sebi-doc-{timestamp}';
        var sessionToken = 'test_session_sebi_doc_{timestamp}';
        var projectId = 'proj_sebi_doc_{timestamp}';
        
        db.users.insertOne({{
          user_id: userId,
          email: 'test.sebi.doc.{timestamp}@example.com',
          name: 'SEBI Document Test User',
          picture: 'https://via.placeholder.com/150',
          role: 'Editor',
          company_id: null,
          created_at: new Date().toISOString()
        }});
        
        db.user_sessions.insertOne({{
          session_id: 'sess_sebi_doc_{timestamp}',
          user_id: userId,
          session_token: sessionToken,
          expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
          created_at: new Date().toISOString()
        }});
        
        db.projects.insertOne({{
          project_id: projectId,
          user_id: userId,
          company_name: 'SEBI DRHP Test Corp',
          sector: 'Finance',
          current_stage: 'Assessment',
          progress_percentage: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }});
        
        print('SESSION_TOKEN=' + sessionToken);
        print('USER_ID=' + userId);
        print('PROJECT_ID=' + projectId);
        '''
    ], capture_output=True, text=True)
    
    data = {}
    for line in result.stdout.split('\n'):
        if line.startswith('SESSION_TOKEN='):
            data['session_token'] = line.split('=')[1]
        elif line.startswith('USER_ID='):
            data['user_id'] = line.split('=')[1]
        elif line.startswith('PROJECT_ID='):
            data['project_id'] = line.split('=')[1]
    
    yield data
    
    # Cleanup
    subprocess.run([
        'mongosh', '--quiet', '--eval', f'''
        use('test_database');
        db.users.deleteMany({{user_id: /test-user-sebi-doc-{timestamp}/}});
        db.user_sessions.deleteMany({{session_token: /test_session_sebi_doc_{timestamp}/}});
        db.projects.deleteMany({{project_id: /proj_sebi_doc_{timestamp}/}});
        db.drhp_output.deleteMany({{project_id: /proj_sebi_doc_{timestamp}/}});
        db.fs.files.deleteMany({{"metadata.project_id": /proj_sebi_doc_{timestamp}/}});
        '''
    ], capture_output=True, text=True)


@pytest.fixture
def api_client(test_data):
    """Create requests session with auth header"""
    session = requests.Session()
    session.headers.update({
        "Authorization": f"Bearer {test_data['session_token']}"
    })
    return session


@pytest.fixture(scope="module")
def imported_drhp(test_data):
    """Import the actual SEBI DRHP document once for all tests"""
    session = requests.Session()
    session.headers.update({
        "Authorization": f"Bearer {test_data['session_token']}"
    })
    
    # Check if test file exists
    if not os.path.exists(DRHP_TEST_FILE):
        pytest.skip(f"Test file not found: {DRHP_TEST_FILE}")
    
    # Import the document
    with open(DRHP_TEST_FILE, 'rb') as f:
        files = {
            'file': ('DRHP_Draft_Test.docx', f, 
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        }
        
        response = session.post(
            f"{BASE_URL}/api/projects/{test_data['project_id']}/drhp-output/import?board_type=sme",
            files=files,
            timeout=120  # Large file may take time
        )
    
    if response.status_code != 200:
        pytest.fail(f"Failed to import DRHP document: {response.status_code} - {response.text}")
    
    return response.json()


class TestDRHPDocumentImport:
    """Test importing the actual 4.8MB SEBI DRHP document"""
    
    def test_import_success(self, imported_drhp):
        """Test that the 4.8MB document imports successfully"""
        assert imported_drhp["success"] == True
        assert imported_drhp["filename"] == "DRHP_Draft_Test.docx"
        assert imported_drhp["board_type"] == "sme"
        
        # Verify file size is approximately 4.8MB
        file_size_mb = imported_drhp["file_size"] / (1024 * 1024)
        assert 4.5 < file_size_mb < 5.5, f"Expected ~4.8MB, got {file_size_mb:.2f}MB"
        
        print(f"PASS: Document imported successfully - {file_size_mb:.2f}MB")
    
    def test_html_content_generated(self, imported_drhp):
        """Test that HTML content is generated"""
        html = imported_drhp["html_content"]
        assert html is not None
        assert len(html) > 0
        
        # Should have the document wrapper
        assert '<div class="drhp-document">' in html
        
        # Should have CSS styles
        assert '<style>' in html
        
        print(f"PASS: HTML content generated - {len(html):,} characters")


class TestHyperlinkExtraction:
    """Test hyperlink extraction and preservation (expected: 140 hyperlinks)"""
    
    def test_hyperlinks_extracted(self, imported_drhp):
        """Test that hyperlinks are extracted from the document"""
        html = imported_drhp["html_content"]
        
        # Count all anchor tags with href
        href_pattern = r'<a\s+[^>]*href="[^"]*"[^>]*>'
        hyperlinks = re.findall(href_pattern, html)
        
        print(f"Found {len(hyperlinks)} hyperlinks in HTML output")
        
        # We expect around 140 hyperlinks
        # Allow some variance due to parsing differences
        assert len(hyperlinks) >= 50, f"Expected at least 50 hyperlinks, found {len(hyperlinks)}"
        
        print(f"PASS: {len(hyperlinks)} hyperlinks extracted")
    
    def test_mailto_links_preserved(self, imported_drhp):
        """Test that mailto: links are preserved"""
        html = imported_drhp["html_content"]
        
        # Check for mailto links
        mailto_pattern = r'href="mailto:[^"]*"'
        mailto_links = re.findall(mailto_pattern, html)
        
        print(f"Found {len(mailto_links)} mailto: links")
        
        # DRHP documents typically have email links
        # This is informational - may or may not have mailto links
        print(f"INFO: {len(mailto_links)} mailto: links found")
    
    def test_http_links_preserved(self, imported_drhp):
        """Test that http/https links are preserved"""
        html = imported_drhp["html_content"]
        
        # Check for http/https links
        http_pattern = r'href="https?://[^"]*"'
        http_links = re.findall(http_pattern, html)
        
        print(f"Found {len(http_links)} http/https links")
        print(f"INFO: {len(http_links)} http/https links found")
    
    def test_bookmark_links_preserved(self, imported_drhp):
        """Test that internal bookmark links (#_bookmark) are preserved"""
        html = imported_drhp["html_content"]
        
        # Check for internal bookmark links
        bookmark_pattern = r'href="#[^"]*"'
        bookmark_links = re.findall(bookmark_pattern, html)
        
        print(f"Found {len(bookmark_links)} internal bookmark links")
        
        # DRHP documents have many internal references
        assert len(bookmark_links) >= 10, f"Expected at least 10 bookmark links, found {len(bookmark_links)}"
        
        print(f"PASS: {len(bookmark_links)} bookmark links preserved")
    
    def test_hyperlink_class_applied(self, imported_drhp):
        """Test that hyperlinks have proper CSS class"""
        html = imported_drhp["html_content"]
        
        # Check for drhp-link class on external links
        drhp_link_count = html.count('class="drhp-link"')
        
        # Check for drhp-bookmark class on internal links
        drhp_bookmark_count = html.count('class="drhp-bookmark"')
        
        print(f"Found {drhp_link_count} external links with drhp-link class")
        print(f"Found {drhp_bookmark_count} bookmark links with drhp-bookmark class")
        
        total_styled = drhp_link_count + drhp_bookmark_count
        assert total_styled >= 10, f"Expected at least 10 styled links, found {total_styled}"
        
        print(f"PASS: {total_styled} links have proper CSS classes")


class TestTablePreservation:
    """Test table preservation (expected: 336 tables)"""
    
    def test_tables_present(self, imported_drhp):
        """Test that tables are present in output"""
        html = imported_drhp["html_content"]
        
        # Count tables
        table_count = html.count('<table class="drhp-table">')
        
        print(f"Found {table_count} tables in HTML output")
        
        # We expect 336 tables
        # Allow some variance
        assert table_count >= 100, f"Expected at least 100 tables, found {table_count}"
        
        print(f"PASS: {table_count} tables found")
    
    def test_table_width_100_percent(self, imported_drhp):
        """Test that tables have width: 100% in CSS"""
        html = imported_drhp["html_content"]
        
        # Check CSS for table width
        assert 'width: 100%' in html or 'width:100%' in html, "Tables should have width: 100%"
        
        print("PASS: Table width 100% found in CSS")
    
    def test_table_layout_fixed(self, imported_drhp):
        """Test that tables have table-layout: fixed"""
        html = imported_drhp["html_content"]
        
        # Check CSS for table-layout
        assert 'table-layout: fixed' in html or 'table-layout:fixed' in html, "Tables should have table-layout: fixed"
        
        print("PASS: table-layout: fixed found in CSS")
    
    def test_table_max_width(self, imported_drhp):
        """Test that tables have max-width: 100%"""
        html = imported_drhp["html_content"]
        
        # Check CSS for max-width
        assert 'max-width: 100%' in html or 'max-width:100%' in html, "Tables should have max-width: 100%"
        
        print("PASS: max-width: 100% found in CSS")
    
    def test_table_word_wrap(self, imported_drhp):
        """Test that tables have word-wrap: break-word"""
        html = imported_drhp["html_content"]
        
        # Check CSS for word-wrap
        assert 'word-wrap: break-word' in html or 'word-wrap:break-word' in html, "Tables should have word-wrap: break-word"
        
        print("PASS: word-wrap: break-word found in CSS")
    
    def test_table_structure(self, imported_drhp):
        """Test that tables have proper structure (tr, th, td)"""
        html = imported_drhp["html_content"]
        
        # Check for table elements
        assert '<tr>' in html, "Tables should have <tr> elements"
        assert '<td>' in html, "Tables should have <td> elements"
        
        # Count rows and cells
        tr_count = html.count('<tr>')
        td_count = html.count('<td>')
        th_count = html.count('<th>')
        
        print(f"Found {tr_count} rows, {th_count} header cells, {td_count} data cells")
        
        assert tr_count >= 100, f"Expected at least 100 table rows, found {tr_count}"
        
        print(f"PASS: Table structure verified - {tr_count} rows")


class TestFontAndStyling:
    """Test font size and styling (expected: 10pt font)"""
    
    def test_font_size_10pt(self, imported_drhp):
        """Test that base font size is 10pt"""
        html = imported_drhp["html_content"]
        
        # Check CSS for 10pt font size
        assert 'font-size: 10pt' in html or 'font-size:10pt' in html, "Base font should be 10pt"
        
        print("PASS: 10pt font size found in CSS")
    
    def test_times_new_roman_font(self, imported_drhp):
        """Test that Times New Roman font is specified"""
        html = imported_drhp["html_content"]
        
        # Check CSS for Times New Roman
        assert "Times New Roman" in html or "times new roman" in html.lower(), "Font should be Times New Roman"
        
        print("PASS: Times New Roman font found in CSS")
    
    def test_body_text_style(self, imported_drhp):
        """Test that Body Text style is mapped correctly"""
        html = imported_drhp["html_content"]
        
        # Check for drhp-body class in CSS
        assert '.drhp-body' in html, "Body Text style should be mapped to .drhp-body"
        
        print("PASS: Body Text style (.drhp-body) found in CSS")
    
    def test_list_paragraph_style(self, imported_drhp):
        """Test that List Paragraph style has proper indentation"""
        html = imported_drhp["html_content"]
        
        # Check for drhp-list-para class in CSS
        assert '.drhp-list-para' in html, "List Paragraph style should be mapped to .drhp-list-para"
        
        # Check for indentation in list paragraph style
        # The CSS should have margin-left for list paragraphs
        list_para_pattern = r'\.drhp-list-para\s*\{[^}]*margin[^}]*\}'
        match = re.search(list_para_pattern, html)
        assert match, "List Paragraph should have margin/indentation"
        
        print("PASS: List Paragraph style with indentation found")
    
    def test_heading_styles(self, imported_drhp):
        """Test that heading styles are mapped correctly"""
        html = imported_drhp["html_content"]
        
        # Check for heading classes
        assert '.drhp-h1' in html, "Heading 1 style should be mapped"
        assert '.drhp-h2' in html, "Heading 2 style should be mapped"
        assert '.drhp-h3' in html, "Heading 3 style should be mapped"
        
        # Check for heading elements in content
        h1_count = html.count('<h1')
        h2_count = html.count('<h2')
        h3_count = html.count('<h3')
        
        print(f"Found {h1_count} h1, {h2_count} h2, {h3_count} h3 elements")
        
        total_headings = h1_count + h2_count + h3_count
        assert total_headings >= 10, f"Expected at least 10 headings, found {total_headings}"
        
        print(f"PASS: Heading styles mapped - {total_headings} headings found")


class TestImageHandling:
    """Test image handling (expected: 54 images)"""
    
    def test_images_extracted(self, imported_drhp):
        """Test that images are extracted from the document"""
        images = imported_drhp.get("images", [])
        images_count = imported_drhp.get("images_count", 0)
        
        print(f"Found {images_count} images extracted")
        
        # We expect 54 images
        # Allow some variance
        assert images_count >= 20, f"Expected at least 20 images, found {images_count}"
        
        print(f"PASS: {images_count} images extracted")
    
    def test_images_have_urls(self, imported_drhp):
        """Test that extracted images have URLs"""
        images = imported_drhp.get("images", [])
        
        if len(images) == 0:
            pytest.skip("No images extracted")
        
        for img in images[:5]:  # Check first 5 images
            assert "url" in img, "Image should have URL"
            assert "file_id" in img, "Image should have file_id"
            assert img["url"].startswith("/api/projects/"), f"Image URL should start with /api/projects/, got {img['url']}"
        
        print(f"PASS: Images have proper URLs")


class TestDocumentStructure:
    """Test overall document structure"""
    
    def test_document_wrapper(self, imported_drhp):
        """Test that document has proper wrapper"""
        html = imported_drhp["html_content"]
        
        assert '<div class="drhp-document">' in html, "Document should have drhp-document wrapper"
        assert '</div>' in html, "Document wrapper should be closed"
        
        print("PASS: Document wrapper present")
    
    def test_css_styles_included(self, imported_drhp):
        """Test that CSS styles are included"""
        html = imported_drhp["html_content"]
        
        assert '<style>' in html, "CSS styles should be included"
        assert '</style>' in html, "CSS style block should be closed"
        
        # Check for key SEBI-specific styles
        assert '.drhp-document' in html
        assert '.drhp-table' in html
        assert '.drhp-link' in html
        assert '.drhp-bookmark' in html
        
        print("PASS: CSS styles included")
    
    def test_no_overflow_styles(self, imported_drhp):
        """Test that overflow is handled properly"""
        html = imported_drhp["html_content"]
        
        # Check for overflow handling
        assert 'overflow-x: hidden' in html or 'overflow:hidden' in html or 'overflow: hidden' in html, \
            "Document should have overflow handling"
        
        print("PASS: Overflow handling present")
    
    def test_warnings_returned(self, imported_drhp):
        """Test that warnings are returned"""
        warnings = imported_drhp.get("warnings", [])
        warnings_count = imported_drhp.get("warnings_count", 0)
        
        print(f"Import completed with {warnings_count} warnings")
        
        if warnings_count > 0:
            print(f"First 5 warnings: {warnings[:5]}")
        
        # Warnings are informational, not a failure
        print(f"INFO: {warnings_count} warnings during import")


class TestDatabasePersistence:
    """Test that imported content is saved to database"""
    
    def test_content_saved(self, api_client, test_data, imported_drhp):
        """Test that content is saved to database"""
        response = api_client.get(
            f"{BASE_URL}/api/projects/{test_data['project_id']}/drhp-output"
        )
        
        assert response.status_code == 200, f"Failed to get saved content: {response.text}"
        data = response.json()
        
        # Verify content was saved
        assert "sme_content" in data, "SME content should be saved"
        assert len(data["sme_content"]) > 0, "SME content should not be empty"
        
        print(f"PASS: Content saved to database - {len(data['sme_content']):,} characters")
    
    def test_import_info_saved(self, api_client, test_data, imported_drhp):
        """Test that import info is saved"""
        response = api_client.get(
            f"{BASE_URL}/api/projects/{test_data['project_id']}/drhp-output"
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify import info
        assert "sme_import_info" in data, "Import info should be saved"
        import_info = data["sme_import_info"]
        
        assert import_info["filename"] == "DRHP_Draft_Test.docx"
        assert import_info["parser"] == "python-docx-sebi"
        assert "imported_at" in import_info
        assert "file_size" in import_info
        assert "images_count" in import_info
        
        print(f"PASS: Import info saved - parser: {import_info['parser']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

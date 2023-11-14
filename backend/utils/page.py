import requests
import lxml.etree as ET
import re
import time

# M221 76H165V132H221V76Z
def extract_coordinates_from_path(path_element):
    d_attribute = path_element.get('d')
    if not d_attribute:
        return None, None

    # Regular expression to extract coordinates following 'M'
    match = re.search(r'M\d+\s+(\d+).*?H(\d+)', d_attribute)
    if match:
        x = int(float(match.group(2)))  # Convert to integer to remove the decimal part
        y = int(float(match.group(1)))  # Convert to integer to remove the decimal part
        return str(x), str(y)
    else:
        return None, None

def download_svg(url):
    """Download SVG from URL and return as an XML element."""
    response = requests.get(url)
    response.raise_for_status()  # This will raise an error for unsuccessful requests
    return ET.fromstring(response.content)

def insert_svg_at_position(tree, new_svg_url, position):
    """Insert a downloaded SVG into the original SVG at a specified position."""
    root = tree.getroot()
    index = position

    print(f"index = {index}")

    # Construct the ID for the group element
    group_id = f"qr_bg_border_{index}"

    # Find the group element by ID
    group_element = root.find(f'.//*[@id="{group_id}"]')

    # Check if the group element is found
    if group_element is None:
        print(f"No <g> element found with id {group_id}")
        return

    # Construct the ID for the <rect> element
    rect_id = f"empty_qr_{index}"

    # Find the <rect> element by ID within the group
    rect_element = group_element.find(f'.//*[@id="{rect_id}"]')
    x_attribute, y_attribute = extract_coordinates_from_path(rect_element)
    print(f"x = {x_attribute}")
    print(f"y = {y_attribute}")

    # Check if the <rect> element is found
    if rect_element is None:
        print(f"No <rect> element found with id {rect_id} in group {group_id}")
        return

    # Download the SVG to insert
    new_svg = download_svg(new_svg_url)
    scale_factor = 58 / 300  # Adjust this based on your content size

    # Apply the transform to the <rect> and all elements within the <g>
    for element in new_svg.findall('.//{http://www.w3.org/2000/svg}rect') + \
                    new_svg.findall('.//{http://www.w3.org/2000/svg}g/*'):
        # Apply a scaling transformation
        element.set('transform', f'scale({scale_factor})')

    new_svg.set('viewBox', '0 0 56 56')
#     g_element = svg_element.find('.//{http://www.w3.org/2000/svg}g')

    # Set the ID for the new SVG
    new_svg.set('id', f"vector_{index}")
    new_svg.set('width', '56')
    new_svg.set('height', '56')
    new_svg.set('x', x_attribute)
    new_svg.set('y', y_attribute)

    # Insert the new SVG after the target element
    rect_element.addnext(new_svg)

def main(original_svg_path, start_number, total_qr_codes):
    tree = ET.parse(original_svg_path)

    for i in range(start_number, start_number + total_qr_codes):
        qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=svg&color=2d2c54&bgcolor=f3eee8&data=https%3A%2F%2Fdcvkfzeyqd763.cloudfront.net%2Fbook%2F{i}"
        insert_svg_at_position(tree, qr_url, i)

    tree.write('modified_svg.svg')


# Usage
original_svg_path = 'shellf_stickers.svg'
main(original_svg_path, 1, 2)  # Start from 1, total 35 QR codes
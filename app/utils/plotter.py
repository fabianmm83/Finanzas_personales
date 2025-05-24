import matplotlib.pyplot as plt
from io import BytesIO
import base64

def plot_to_base64(labels, values):
    plt.bar(labels, values)
    plt.xticks(rotation=45)
    buffer = BytesIO()
    plt.savefig(buffer, format='png')
    plt.close()
    return base64.b64encode(buffer.getvalue()).decode('utf-8')
import React, { useState, useEffect } from 'react';
import jsonpointer from 'jsonpointer';

const RenderSvgTemplate = ({ credential, classNames }) => {

	const svgUrl = credential.vcData.renderMethod.id;
	const [svgContent, setSvgContent] = useState(null);

	useEffect(() => {
		const fetchSvgContent = async () => {
			try {
				const response = await fetch(svgUrl);
				if (!response.ok) {
					throw new Error(`Failed to fetch SVG from ${svgUrl}`);
				}

				const svgText = await response.text();
				setSvgContent(svgText);
			} catch (error) {
				console.error(error);
			}
		};

		fetchSvgContent();
	}, [svgUrl]);

	if (svgContent === null) {
		return null;
	}

	const regex = /{{([^}]+)}}/g;

	const replaceText = (match, content) => {
		console.log(match, content);
		const res = jsonpointer.get(credential.vcData, content)
		console.log('res= ', res);

		if (res) {
			return res;
		} else {
			return null;
		}
	};

	const replacedSvgText = svgContent.replace(regex, replaceText);

	const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(replacedSvgText)}`;

	return (
		<img src={dataUri} alt="Rendered SVG" className={classNames} />
	);
}

export default RenderSvgTemplate;
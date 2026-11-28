// Preparación en memoria: fotos ajustadas y archivos originales sin modificar.
(() => {
  const readFile = file => new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error('No pudimos leer el archivo. Elegilo de nuevo.'));reader.readAsDataURL(file);});
  async function prepare(file,{maxPixels=3800000,quality=.9,allowWebp=false,photosOnly=false}={}) {
    let source=file, mime=file.type || (/\.pdf$/i.test(file.name)?'application/pdf':/\.png$/i.test(file.name)?'image/png':/\.jpe?g$/i.test(file.name)?'image/jpeg':allowWebp&&/\.webp$/i.test(file.name)?'image/webp':'');
    let nombre=file.name;
    if(![...(photosOnly?[]:['application/pdf']),'image/png','image/jpeg',...(allowWebp?['image/webp']:[])].includes(mime)||!file.size||file.size>5*1024*1024)throw Error(photosOnly?'Elegí una foto JPG, PNG o WebP de hasta 5 MB.':'Elegí un PDF, JPG o PNG de hasta 5 MB.');
    if(mime!=='application/pdf') {
      const url=URL.createObjectURL(file);
      try {
        const image=new Image();image.src=url;await image.decode();
        if(mime==='image/jpeg'||mime==='image/webp'||image.naturalWidth*image.naturalHeight>maxPixels){
          const scale=Math.min(1,Math.sqrt(maxPixels/(image.naturalWidth*image.naturalHeight)));
          const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.floor(image.naturalWidth*scale));canvas.height=Math.max(1,Math.floor(image.naturalHeight*scale));
          const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
          source=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));
          if(!source)throw Error(photosOnly?'No pudimos preparar la foto. Probá con otra copia JPG o PNG.':'No pudimos preparar la foto. Probá con otra copia o un PDF.');
          nombre=nombre.replace(/\.[^.]+$/,'')+'.jpg';mime='image/jpeg';
        }
      } catch(_) { throw Error(photosOnly?'No pudimos preparar la foto. Probá con otra copia JPG o PNG.':'No pudimos preparar la foto. Probá con otra copia o un PDF.'); }
      finally { URL.revokeObjectURL(url); }
    }
    if(source.size>5*1024*1024)throw Error('El archivo preparado supera 5 MB. Elegí una copia más liviana.');
    return {nombre,mime,contenidoBase64:await readFile(source)};
  }
  window.ElAngelAzulFileInput={prepare};
})();
